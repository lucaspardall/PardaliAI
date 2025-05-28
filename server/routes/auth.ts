
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido')
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

/**
 * Rota para registro de usuário
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: result.error.errors
      });
    }

    const { email, password, firstName, lastName } = result.data;

    // Verificar se usuário já existe
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: 'Email já está em uso'
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar usuário
    const userId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await storage.upsertUser({
      id: userId,
      email,
      firstName,
      lastName,
      passwordHash,
      emailVerified: false,
      authProvider: 'email',
      plan: 'free',
      planStatus: 'active',
      aiCreditsLeft: 10,
      storeLimit: 1
    });

    // Gerar token JWT
    const token = jwt.sign(
      { userId, email, authProvider: 'email' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Configurar cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        authProvider: 'email'
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * Rota para login de usuário
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: result.error.errors
      });
    }

    const { email, password } = result.data;

    // Buscar usuário
    const user = await storage.getUserByEmail(email);
    if (!user || user.authProvider !== 'email' || !user.passwordHash) {
      return res.status(401).json({
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, authProvider: 'email' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Configurar cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * Rota para logout
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logout realizado com sucesso' });
});

/**
 * Rota GET para logout completo (Replit + JWT)
 */
router.get('/logout', (req: Request, res: Response) => {
  // Limpar cookie JWT se existir
  res.clearCookie('auth_token');
  
  // Verificar se é autenticação Replit
  if (req.user && req.user.claims && req.user.claims.sub) {
    // Logout do Replit via middleware
    if (req.logout) {
      return req.logout(() => {
        res.redirect('/');
      });
    }
  }
  
  // Logout simples para JWT
  res.redirect('/');
});

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
    res.json({
      message: 'Sessão renovada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao renovar sessão:', error);
    res.status(500).json({
      message: 'Erro ao renovar sessão'
    });
  }
});

/**
 * Rota para atualizar perfil do usuário
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    // Verificar autenticação
    let userId: string | null = null;
    
    // Verificar token JWT
    if (req.cookies.auth_token) {
      try {
        const decoded = jwt.verify(req.cookies.auth_token, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (error) {
        // Token inválido
      }
    }
    
    // Verificar autenticação Replit
    if (!userId && req.user && req.user.claims && req.user.claims.sub) {
      userId = req.user.claims.sub;
    }
    
    if (!userId) {
      return res.status(401).json({
        message: 'Não autorizado'
      });
    }

    // Validar dados
    const result = updateProfileSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: result.error.errors
      });
    }

    const { firstName, lastName, email } = result.data;

    // Verificar se email já está em uso por outro usuário
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        message: 'Este email já está em uso por outro usuário'
      });
    }

    // Buscar usuário atual
    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      return res.status(404).json({
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar usuário
    await storage.upsertUser({
      ...currentUser,
      firstName,
      lastName,
      email
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: userId,
        firstName,
        lastName,
        email
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
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
