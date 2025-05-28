
import { ClerkExpressRequireAuth, clerkMiddleware } from '@clerk/express';
import { Request, Response, NextFunction, Application } from 'express';

// Setup principal do Clerk para Express
const setupClerkAuth = (app: Application) => {
  console.log("🔐 Configurando Clerk auth para Express");
  app.use(clerkMiddleware());
};

// Middleware de autenticação para uso nas rotas
const isAuthenticated = (req: any, res: any, next: any) => {
  try {
    if (!req.auth?.userId) {
      console.log('❌ Usuário não autenticado tentando acessar:', req.path);
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.log('✅ Auth OK para rota:', req.path, '- User:', req.auth.userId.slice(0, 8) + '...');
    next();
  } catch (error) {
    console.log('❌ Erro de autenticação:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware opcional usando o ClerkExpressRequireAuth oficial
const requireAuth = () => {
  return ClerkExpressRequireAuth();
};

export { setupClerkAuth, isAuthenticated, requireAuth };
