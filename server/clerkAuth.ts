

import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { Request, Response, NextFunction, Application } from 'express';

// Setup principal do Clerk para Express
const setupClerkAuth = (app: Application) => {
  console.log("🔐 Configurando Clerk auth para Express");
  app.use(clerkMiddleware());
};

// Middleware de autenticação para uso nas rotas
const isAuthenticated = (req: any, res: any, next: any) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      console.log('❌ Usuário não autenticado tentando acessar:', req.path);
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('✅ Auth OK para rota:', req.path, '- User:', userId.slice(0, 8) + '...');
    next();
  } catch (error) {
    console.log('❌ Erro de autenticação:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware oficial do Clerk para proteção de rotas
const requireClerkAuth = () => {
  return requireAuth();
};

export { setupClerkAuth, isAuthenticated, requireClerkAuth, getAuth };

