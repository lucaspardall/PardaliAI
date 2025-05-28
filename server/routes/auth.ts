
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * Rota para verificar status de autenticação
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    if (req.user && req.user.claims && req.user.claims.sub) {
      res.json({
        authenticated: true,
        user: {
          id: req.user.claims.sub,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
        }
      });
    } else {
      res.json({
        authenticated: false,
        user: null
      });
    }
  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error);
    res.status(500).json({
      authenticated: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Rota para refresh de sessão
 */
router.post('/refresh', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth();
    console.log('🔄 Refresh session for user:', auth?.userId?.slice(0, 8));
    
    res.json({
      message: 'Sessão renovada com sucesso',
      timestamp: new Date().toISOString(),
      userId: auth?.userId
    });
  } catch (error) {
    console.error('Erro ao renovar sessão:', error);
    res.status(500).json({
      message: 'Erro ao renovar sessão'
    });
  }
});

/**
 * Rota de health check para autenticação
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'authentication'
  });
});

// Notification Service Functions
export async function createNotification(userId: string, title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  try {
    await storage.createNotification({
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function createSystemInsight(userId: string, insight: string, actionSuggestion?: string) {
  await createNotification(
    userId,
    'Insight da IA',
    `${insight}${actionSuggestion ? ` Sugestão: ${actionSuggestion}` : ''}`,
    'info'
  );
}

export default router;
