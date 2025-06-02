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
  console.log('🔧 Session middleware loading with optimized config...');
  
  const sessionTtl = 86400; // 24 hours in seconds
  const sessionTtlMs = sessionTtl * 1000; // 24 hours in milliseconds

  // Usar PostgreSQL para armazenamento de sessão
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    // Usar o cliente SQL com a função 'query' que adicionamos
    pool: sql,
    tableName: 'sessions',
    createTableIfMissing: true,
    ttl: sessionTtl, // 24h TTL
    touchAfter: 900, // Only update once every 15 minutes (900 seconds)
  });

  console.log('✅ Session store configured with touchAfter: 900 seconds');

  return session({
    secret: process.env.SESSION_SECRET || 'temp-session-secret-for-development',
    saveUninitialized: false, // Don't save empty sessions
    resave: false, // Don't save session if unmodified
    rolling: false, // Don't reset expiry on every request
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure cookies in production
      sameSite: 'lax',
      maxAge: sessionTtlMs, // 24 hours
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
    // Limpar cookie JWT se existir
    res.clearCookie('auth_token');

    if (req.logout) {
      req.logout((err) => {
        if (err) {
          console.error('Erro no logout:', err);
        }

        // Destruir sessão completamente
        if (req.session) {
          req.session.destroy((sessionErr) => {
            if (sessionErr) {
              console.error('Erro ao destruir sessão:', sessionErr);
            }
            res.redirect('/');
          });
        } else {
          res.redirect('/');
        }
      });
    } else {
      res.redirect('/');
    }
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

// Middleware unificado de autenticação
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
    };
  };
}

export async function isAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // 1. Verificar se já está autenticado via Replit (sessão)
    if (req.user && req.user.claims && req.user.claims.sub) {
      return next();
    }

    // 2. Verificar token JWT (email/senha)
    const authToken = req.cookies?.auth_token;

    if (authToken) {
      try {
        const decoded = jwt.verify(authToken, JWT_SECRET) as any;
        const user = await storage.getUser(decoded.userId);

        if (user) {
          req.user = {
            claims: {
              sub: user.id,
              email: user.email || '',
              first_name: user.firstName || '',
              last_name: user.lastName || ''
            }
          };
          return next();
        }
      } catch (jwtError) {
        console.log('JWT inválido, tentando autenticação Replit...');
      }
    }

    // 3. Verificar headers Replit (ambiente de desenvolvimento)
    const replitUserId = req.headers['x-replit-user-id'];

    if (replitUserId) {
      req.user = {
        claims: {
          sub: replitUserId as string,
          email: req.headers['x-replit-user-email'] as string || '',
          first_name: req.headers['x-replit-user-name'] as string || '',
          last_name: ''
        }
      };
      return next();
    }

    // 4. Não autenticado
    return res.status(401).json({ 
      message: "Não autorizado",
      code: "UNAUTHORIZED"
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      message: "Erro de autenticação",
      code: "AUTH_ERROR"
    });
  }
}