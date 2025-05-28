
import { useState, useEffect, useCallback } from 'react';

interface ReplitUser {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  profileImageUrl?: string;
  plan: string;
  planStatus: string;
  planExpiresAt?: string;
  aiCreditsLeft: number;
  storeLimit: number;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ReplitUser | null;
}

interface AuthReturn extends AuthState {
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export function useAuth(): AuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Verificando autenticação...');

      const response = await fetch('/api/auth/user', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Usuário autenticado:', userData);

        setState({
          isAuthenticated: true,
          isLoading: false,
          user: userData
        });
      } else if (response.status === 401) {
        console.log('❌ Usuário não autenticado');
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
      } else {
        console.error('❌ Erro inesperado:', response.status);
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Fazendo logout...');
      
      // Chamar endpoint de logout no servidor
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Logout realizado com sucesso');
      } else {
        console.warn('⚠️ Erro no logout do servidor, continuando...');
      }
    } catch (error) {
      console.warn('⚠️ Erro no logout:', error);
    } finally {
      // Sempre limpar estado local
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });

      // Redirecionar para landing
      window.location.href = '/';
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      if (mounted) {
        await checkAuth();
      }
    };

    // Verificação inicial
    initAuth();

    // Verificação periódica apenas se autenticado (mais espaçada)
    const startPeriodicCheck = () => {
      timeoutId = setTimeout(() => {
        if (mounted && state.isAuthenticated) {
          checkAuth().then(() => {
            if (mounted) startPeriodicCheck();
          });
        }
      }, 10 * 60 * 1000); // 10 minutos
    };

    // Só inicia verificação periódica se estiver autenticado
    if (state.isAuthenticated) {
      startPeriodicCheck();
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [checkAuth, state.isAuthenticated]);

  return {
    ...state,
    logout,
    refreshAuth
  };
}
