
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import bcrypt from 'bcrypt';
import { storage } from '../storage';

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
    const auth = typeof (req as any).auth === 'function' ? (req as any).auth() : (req as any).auth;
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
 * Rota para login com email e senha
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário por email
    const user = await storage.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Credenciais inválidas'
      });
    }

    // Criar sessão manual
    req.session.userId = user.id;
    req.session.authMethod = 'email';

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Erro no login por email:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * Rota para registro com email e senha
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Todos os campos são obrigatórios'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'As senhas não coincidem'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: 'Email já está em uso'
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar usuário
    const newUser = await storage.upsertUser({
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      firstName: email.split('@')[0],
      lastName: '',
      profileImageUrl: '',
      plan: 'free',
      planStatus: 'active',
      planExpiresAt: null,
      aiCreditsLeft: 10,
      storeLimit: 1,
      passwordHash
    });

    // Criar sessão
    req.session.userId = newUser.id;
    req.session.authMethod = 'email';

    res.status(201).json({
      message: 'Conta criada com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (error) {
    console.error('Erro no registro por email:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * Rota para logout
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    console.log('🚪 Logout solicitado');
    
    // Limpar sessão
    req.session.destroy((err) => {
      if (err) {
        console.error('Erro ao destruir sessão:', err);
        return res.status(500).json({
          message: 'Erro ao fazer logout'
        });
      }

      // Limpar cookie de sessão
      res.clearCookie('connect.sid');
      
      console.log('✅ Logout realizado com sucesso');
      res.json({
        message: 'Logout realizado com sucesso'
      });
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
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
