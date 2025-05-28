

import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { Request, Response, NextFunction, Application } from 'express';

// Validação das chaves Clerk
const validateClerkKeys = () => {
  // Usar as variáveis corretas dos Secrets do Replit
  const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  if (!publishableKey) {
    throw new Error('❌ VITE_CLERK_PUBLISHABLE_KEY não configurada! Configure nos Secrets do Replit.');
  }
  
  if (!secretKey) {
    throw new Error('❌ CLERK_SECRET_KEY não configurada! Configure nos Secrets do Replit.');
  }
  
  if (publishableKey === 'pk_test_your_publishable_key_here') {
    throw new Error('❌ Configure uma VITE_CLERK_PUBLISHABLE_KEY válida nos Secrets.');
  }
  
  if (secretKey === 'sk_test_your_secret_key_here') {
    throw new Error('❌ Configure uma CLERK_SECRET_KEY válida nos Secrets.');
  }
  
  console.log('✅ Chaves Clerk validadas com sucesso');
  return { publishableKey, secretKey };
};

// Setup principal do Clerk para Express
const setupClerkAuth = (app: Application) => {
  try {
    console.log("🔐 Configurando Clerk auth para Express");
    
    // Validar chaves antes de configurar
    validateClerkKeys();
    
    // Configurar middleware Clerk
    app.use(clerkMiddleware());
    
    console.log("✅ Clerk middleware configurado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao configurar Clerk:", error);
    throw error;
  }
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

