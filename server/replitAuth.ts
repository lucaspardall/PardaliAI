
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
  console.warn("Environment variable REPLIT_DOMAINS not provided, using hostname fallback");
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
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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

// Função auxiliar para obter domínios e URLs de callback
function getDomainInfo() {
  // Obtém a lista de domínios dos variáveis de ambiente
  const domains = process.env.REPLIT_DOMAINS 
    ? process.env.REPLIT_DOMAINS.split(",").filter(d => d.trim()) 
    : [];

  // Adiciona o domínio de produção se estiver definido
  if (process.env.PRODUCTION_DOMAIN && !domains.includes(process.env.PRODUCTION_DOMAIN)) {
    domains.push(process.env.PRODUCTION_DOMAIN);
  }

  // Adiciona cipshopee.replit.app como fallback se não houver domínios
  if (domains.length === 0) {
    domains.push('cipshopee.replit.app');
  }

  // Gera URLs de callback para cada domínio
  const callbackUrls = domains.map(domain => `https://${domain}/api/callback`);

  return { domains, callbackUrls };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();
  const { domains, callbackUrls } = getDomainInfo();

  // Registra os domínios para depuração
  console.log('[Auth] Domínios configurados:', domains.join(', '));
  console.log('[Auth] URLs de callback:', callbackUrls.join(', '));

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

  try {
    // Cria uma estratégia principal com todos os URLs de callback permitidos
    passport.use('replitauth', new Strategy(
      {
        name: 'replitauth',
        config,
        scope: "openid email profile offline_access",
        callbackURL: callbackUrls[0], // URL principal
        params: {
          // Permitir múltiplos URLs de redirecionamento
          redirect_uri: callbackUrls
        }
      },
      verify
    ));

    console.log(`[Auth] Estratégia principal criada com nome 'replitauth'`);
    
    // Configura estratégias específicas para cada domínio
    domains.forEach((domain, index) => {
      const strategyName = `replitauth:${domain}`;
      passport.use(strategyName, new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: callbackUrls[index],
        },
        verify
      ));
      console.log(`[Auth] Estratégia criada: ${strategyName}`);
    });
  } catch (error) {
    console.error("[Auth] Erro ao configurar estratégias:", error);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    try {
      const hostname = req.hostname || '';
      console.log(`[Auth] Iniciando login com hostname: ${hostname}`);
      
      // Tenta encontrar a melhor estratégia para este domínio
      let strategyName = `replitauth:${hostname}`;
      
      // Se a estratégia específica não existir, usa a estratégia padrão
      if (!passport._strategies[strategyName]) {
        strategyName = 'replitauth';
        console.log(`[Auth] Usando estratégia padrão: ${strategyName}`);
      } else {
        console.log(`[Auth] Usando estratégia específica: ${strategyName}`);
      }
      
      return passport.authenticate(strategyName, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    } catch (error) {
      console.error('[Auth] Erro ao iniciar login:', error);
      res.status(500).json({ 
        message: 'Falha ao iniciar processo de autenticação',
        error: error.message
      });
    }
  });

  app.get("/api/callback", (req, res, next) => {
    try {
      console.log(`[Auth] Recebendo callback com query params:`, req.query);
      
      // Se não tiver código, não prossegue
      if (!req.query.code) {
        console.error('[Auth] Requisição de callback sem código de autorização');
        return res.redirect('/login-error');
      }
      
      // Tenta autenticar utilizando a estratégia principal
      passport.authenticate('replitauth', (err: any, user: any, info: any) => {
        if (err) {
          console.error('[Auth] Erro durante autenticação:', err);
          return res.redirect('/login-error');
        }
        
        if (!user) {
          console.error('[Auth] Usuário não retornado pela estratégia:', info);
          return res.redirect('/login-error');
        }
        
        req.login(user, function(loginErr) {
          if (loginErr) {
            console.error('[Auth] Erro ao criar sessão:', loginErr);
            return res.redirect('/login-error');
          }
          
          console.log('[Auth] Login bem-sucedido, redirecionando para /', { 
            userId: user?.claims?.sub 
          });
          
          return res.redirect('/');
        });
      })(req, res, next);
    } catch (error) {
      console.error('[Auth] Erro crítico no callback:', error);
      return res.redirect('/login-error');
    }
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
