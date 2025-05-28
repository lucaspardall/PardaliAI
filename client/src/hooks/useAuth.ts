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

    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando autenticação Replit...');

        // Buscar dados do usuário Replit via endpoint nativo
        const response = await fetch('/__replauthuser', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Usuário Replit autenticado:', userData);

          if (mounted) {
            setState({
              isAuthenticated: true,
              isLoading: false,
              user: userData
            });
          }
        } else {
          console.log('❌ Usuário não autenticado no Replit');
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

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}