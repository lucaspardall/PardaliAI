
import { clerkMiddleware, requireAuth } from '@clerk/express';
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";

export function setupAuth(app: Express) {
  return setupClerkAuth(app);
}

export function setupClerkAuth(app: Express) {
  // Verificar se as chaves do Clerk estão configuradas
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('⚠️ Clerk não configurado. Configure CLERK_SECRET_KEY nos Secrets do Replit');
    console.error('Acesse: https://dashboard.clerk.com para obter suas chaves');
    return;
  }

  if (!process.env.VITE_CLERK_PUBLISHABLE_KEY) {
    console.error('⚠️ Configure VITE_CLERK_PUBLISHABLE_KEY nos Secrets do Replit');
    return;
  }

  // Middleware do Clerk
  app.use(clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  }));

  // Rota para obter dados do usuário
  app.get('/api/auth/user', requireAuth(), async (req: any, res) => {
    try {
      const { userId } = req.auth;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'User not authenticated',
          authenticated: false 
        });
      }

      const clerkUser = await req.auth().user;

      // Buscar ou criar usuário no banco
      let user = await storage.getUser(userId);
      
      if (!user) {
        // Criar novo usuário baseado nos dados do Clerk
        await storage.upsertUser({
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          profileImageUrl: clerkUser.imageUrl || '',
          plan: "free",
          planStatus: "active",
          planExpiresAt: null,
          aiCreditsLeft: 10,
          storeLimit: 1
        });
        
        user = await storage.getUser(userId);
      }

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          authenticated: false 
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      res.status(500).json({ 
        error: "Falha ao buscar dados do usuário",
        authenticated: false,
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Rota de logout
  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logout realizado' });
  });
}

/**
 * Middleware para verificar autenticação Clerk
 */
export const isAuthenticated: RequestHandler = requireAuth();

// Alias para compatibilidade
export { requireAuth };
