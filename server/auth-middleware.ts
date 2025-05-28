
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
    };
  };
}

/**
 * Middleware unificado que suporta múltiplos métodos de autenticação
 */
export const isAuthenticated = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Verificar Replit Auth (prioritário - já configurado)
    if (req.user && req.user.claims && req.user.claims.sub) {
      // Usuário autenticado via Replit
      return next();
    }

    // 2. Verificar Email/Senha session (futuro)
    if (req.session && (req.session as any).userId) {
      try {
        const user = await storage.getUser((req.session as any).userId);
        if (user && user.authProvider === 'email') {
          req.user = {
            claims: {
              sub: user.id,
              email: user.email || undefined,
              first_name: user.firstName || undefined,
              last_name: user.lastName || undefined,
            }
          };
          console.log('✅ Usuário autenticado via email/senha:', user);
          return next();
        }
      } catch (error) {
        console.error('Erro ao verificar sessão email/senha:', error);
      }
    }

    // 3. Não autenticado
    return handleUnauthenticated(req, res);
    
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

async function getUserData(userId: string) {
  try {
    const user = await storage.getUser(userId);
    return user ? {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      plan: user.plan,
      planStatus: user.planStatus,
      planExpiresAt: user.planExpiresAt,
      aiCreditsLeft: user.aiCreditsLeft,
      storeLimit: user.storeLimit,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } : null;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return null;
  }
}

function handleUnauthenticated(req: Request, res: Response) {
  // Para requisições da API, retornar JSON
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ 
      message: 'Não autorizado',
      code: 'UNAUTHORIZED'
    });
  }

  // Para outras requisições, redirecionar para login
  return res.redirect('/api/login');
}

/**
 * Middleware opcional que não bloqueia se não autenticado
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await isAuthenticated(req, res, () => {
      // Se autenticado, continua
      next();
    });
  } catch {
    // Se não autenticado, continua mesmo assim
    next();
  }
};
