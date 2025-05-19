import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { db, sql } from "./db";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// Armazenamento temporário em memória para usuários em desenvolvimento
const inMemoryUsers: Record<string, User> = {};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Usar PostgreSQL para armazenamento de sessão
  const PgStore = connectPg(session);
  let sessionStore;
  
  try {
    sessionStore = new PgStore({
      // Usar o cliente SQL com a função 'query' que adicionamos
      pool: sql,
      tableName: 'sessions',
      createTableIfMissing: true
    });
    console.log('[Auth] Sessão configurada com PostgreSQL');
  } catch (error) {
    console.error('[Auth] Erro ao configurar sessão com PostgreSQL, usando memória:', error);
    // Fallback para armazenamento em memória
    sessionStore = new session.MemoryStore();
  }
  
  return session({
    secret: process.env.SESSION_SECRET || 'temp-session-secret-for-development',
    resave: true,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Permitir HTTP para desenvolvimento
      maxAge: sessionTtl,
      sameSite: 'lax'
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  console.log('[Auth] Tentando salvar usuário com claims:', JSON.stringify({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"]
  }));
  
  try {
    // Tenta salvar no banco de dados
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      plan: "free",
      planStatus: "active",
      planExpiresAt: null,
      aiCreditsLeft: 10,
      storeLimit: 1
    });
    console.log('[Auth] Usuário salvo com sucesso no banco de dados');
  } catch (error) {
    console.error("Erro ao salvar usuário no banco de dados, usando armazenamento em memória:", error);
    
    // Fallback para armazenamento em memória em caso de erro
    const userId = claims["sub"];
    inMemoryUsers[userId] = {
      id: userId,
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      plan: "free",
      planStatus: "active",
      planExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      aiCreditsLeft: 10,
      storeLimit: 1
    };
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    
    try {
      await upsertUser(tokens.claims());
    } catch (error) {
      console.error("Erro durante a autenticação:", error);
      // Continua mesmo com erro no banco de dados
    }
    
    verified(null, user);
  };

  // Adicionar log para depuração
  console.log('[Auth] Domínios configurados:', process.env.REPLIT_DOMAINS);
  
  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const callbackURL = `https://${domain}/api/callback`;
    console.log(`[Auth] Configurando estratégia para domínio: ${domain} com callback: ${callbackURL}`);
    
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const hostname = req.hostname;
    console.log(`[Auth] Iniciando login com hostname: ${hostname}`);
    
    passport.authenticate(`replitauth:${hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log(`[Auth] Recebendo callback com query params:`, req.query);
    const hostname = req.hostname;
    console.log(`[Auth] Hostname: ${hostname}`);
    
    // Verificar se a estratégia existe para o hostname atual
    const strategyName = `replitauth:${hostname}`;
    if (!passport._strategies[strategyName]) {
      console.error(`[Auth] Estratégia ${strategyName} não encontrada. Estratégias disponíveis:`, Object.keys(passport._strategies));
      return res.redirect('/login-error');
    }
    
    // Usar authenticate com um callback personalizado para depuração
    passport.authenticate(strategyName, { failureRedirect: '/login-error' })(req, res, function() {
      console.log('[Auth] Login bem-sucedido, redirecionando para /', { userId: (req.user as any)?.claims?.sub });
      return res.redirect('/');
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
  
  // Adicionar rota para erros de login
  app.get("/login-error", (req, res) => {
    console.log('[Auth] Erro no processo de login');
    res.status(401).json({ 
      message: "Falha na autenticação com o Replit", 
      redirectTo: "/api/login" 
    });
  });
  
  // Rota modificada para pegar os dados do usuário considerando o fallback em memória
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user;
      
      try {
        // Tenta buscar do banco de dados 
        user = await storage.getUser(userId);
      } catch (error) {
        console.log("Erro ao buscar usuário do banco, usando cache em memória:", error);
        // Usa fallback em memória se falhar
        user = inMemoryUsers[userId];
      }
      
      if (!user) {
        // Cria um usuário básico com dados do token se não encontrar
        user = {
          id: userId,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
          plan: "free",
          planStatus: "active",
          planExpiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          aiCreditsLeft: 10,
          storeLimit: 1
        };
        
        // Salva em memória
        inMemoryUsers[userId] = user;
      }
      
      res.json(user);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      res.status(500).json({ message: "Falha ao buscar dados do usuário" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.claims?.exp) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.claims.exp) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};
