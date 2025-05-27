
import { clerkMiddleware, requireAuth } from '@clerk/express';
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";

export function setupAuth(app: Express) {
  return setupClerkAuth(app);
}

export function setupClerkAuth(app: Express) {
  // Middleware do Clerk
  app.use(clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY!,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  }));

  // Rota para obter dados do usuário
  app.get('/api/auth/user', requireAuth(), async (req: any, res) => {
    try {
      const { userId } = req.auth;
      const clerkUser = req.auth.user;

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

      res.json(user);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      res.status(500).json({ 
        message: "Falha ao buscar dados do usuário",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
