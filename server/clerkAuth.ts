// server/clerkAuth.ts

import { ClerkExpressWithAuth } from '@clerk/clerk-sdk/server';
import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import express from 'express';

const app = express();

// Clerk setup
const setupAuth = () => {
  console.log("Clerk auth setup");
  app.use(ClerkExpressWithAuth());
};

// Middleware de autenticação para uso nas rotas
const isAuthenticated = (req: any, res: any, next: any) => {
  try {
    const auth = req.auth();
    if (!auth?.userId) {
      console.log('❌ Usuário não autenticado tentando acessar:', req.path);
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.log('✅ Auth OK para rota:', req.path, '- User:', auth.userId.slice(0, 8) + '...');
    next();
  } catch (error) {
    console.log('❌ Erro de autenticação:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const requireAuth = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };
};

// Rota para obter dados do usuário
app.get('/api/auth/user', requireAuth(), async (req: any, res) => {
  const userId = req.auth?.userId;
  res.json({ userId: userId, message: 'User authenticated' });
});

export { setupAuth, isAuthenticated };