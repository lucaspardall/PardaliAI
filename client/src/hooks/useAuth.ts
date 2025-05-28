import { useState, useEffect } from 'react';

interface ReplitUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  url?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ReplitUser | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando autenticação Replit...');

        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Usuário autenticado:', userData);

          if (mounted) {
            setState({
              isAuthenticated: true,
              isLoading: false,
              user: userData
            });
          }
        } else if (response.status === 401) {
          console.log('❌ Usuário não autenticado');
          if (mounted) {
            setState({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
          }
        } else {
          console.error('❌ Erro inesperado:', response.status);
          if (mounted) {
            setState({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        if (mounted) {
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null
          });
        }
      }
    };

    // Verificação inicial
    checkAuth();

    // Verificação periódica mais espaçada (apenas se autenticado)
    const startPeriodicCheck = () => {
      timeoutId = setTimeout(() => {
        if (mounted && state.isAuthenticated) {
          checkAuth().then(() => {
            if (mounted) startPeriodicCheck();
          });
        }
      }, 5 * 60 * 1000); // 5 minutos
    };

    startPeriodicCheck();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [state.isAuthenticated]);

  return state;
}