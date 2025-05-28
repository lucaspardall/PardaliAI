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
  const sessionStore = new PgStore({
    // Usar o cliente SQL com a função 'query' que adicionamos
    pool: sql,
    tableName: 'sessions',
    createTableIfMissing: true
  });

  return session({
    secret: process.env.SESSION_SECRET || 'temp-session-secret-for-development',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Definir como false para desenvolvimento para permitir cookies em HTTP
      maxAge: sessionTtl,
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

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successRedirect: "/dashboard",
      failureRedirect: "/api/login",
    })(req, res, next);
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

        // Tenta salvar no banco
        try {
          await upsertUser(req.user.claims);
        } catch (saveError) {
          console.log("Erro ao salvar novo usuário no banco:", saveError);
        }

        // Salva em memória como fallback
        inMemoryUsers[userId] = user;
      }

      res.json(user);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      res.status(500).json({ 
        message: "Falha ao buscar dados do usuário",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
}

/**
 * Middleware para verificar autenticação Replit Auth
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    // Em ambiente de desenvolvimento, podemos ignorar autenticação
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      req.user = {
        claims: {
          sub: 'dev_user',
          email: 'dev@example.com',
          first_name: 'Developer',
          last_name: 'Mode',
          profile_image_url: '',
        }
      };
      return next();
    }

    // Log apenas em desenvolvimento para evitar spam
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Verificando autenticação...');
    }

    if (req.user && req.user.claims && req.user.claims.sub) {
      const user = await storage.getUser(req.user.claims.sub);
      if (user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Usuário autenticado:', { id: user.id, email: user.email });
        }
        return next();
      }
    }

    // Log apenas quando necessário
    if (process.env.NODE_ENV === 'development' && req.path !== '/api/auth/user') {
      console.log('❌ Usuário não autenticado tentando acessar:', req.path);
    }

    // Verifica se o usuário está autenticado
    if (!req.user || !req.user.claims || !req.user.claims.sub) {
      console.log('Usuário não autenticado tentando acessar:', req.path);

      // Para APIs, retornar 401
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ 
          message: 'Não autorizado',
          code: 'UNAUTHORIZED',
          redirectTo: '/?login=required'
        });
      }

      // Para páginas, redirecionar para a página inicial com parâmetro de login
      return res.redirect('/?login=required');
    }

    // Verificar se o token não expirou
    if (req.user.expires_at && new Date() > new Date(req.user.expires_at * 1000)) {
      console.log('Token expirado para usuário:', req.user.claims.sub);

      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ 
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED',
          redirectTo: '/api/login'
        });
      }

      return res.redirect('/api/login');
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);

    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ 
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }

    return res.redirect('/?error=auth_error');
  }
};