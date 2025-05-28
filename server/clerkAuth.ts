
import { ClerkExpressWithAuth } from '@clerk/express';
import { Request, Response, NextFunction, Application } from 'express';

// Setup principal do Clerk para Express
const setupClerkAuth = (app: Application) => {
  console.log("🔐 Configurando Clerk auth para Express");
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

// Middleware opcional para casos específicos
const requireAuth = () => {
  return (req: any, res: Response, next: NextFunction) => {
    try {
      const auth = req.auth();
      if (!auth?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
  };
};

export { setupClerkAuth, isAuthenticated, requireAuth };
