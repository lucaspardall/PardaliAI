
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
        // Verificar se estamos no Replit
        const hostname = window.location.hostname;
        const isReplit = hostname.includes('replit.dev') || hostname.includes('repl.co');
        
        if (!isReplit) {
          console.log('🔧 Ambiente não-Replit detectado, usando modo desenvolvimento');
          if (mounted) {
            setState({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
          }
          return;
        }

        // Buscar dados do usuário Replit via endpoint interno
        const response = await fetch('/__replauthuser', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          
          if (mounted && userData && userData.id) {
            setState({
              isAuthenticated: true,
              isLoading: false,
              user: {
                id: userData.id,
                name: userData.name || 'Usuário',
                email: userData.name + '@replit.user', // Replit não expõe email
                profileImage: userData.profileImage,
                bio: userData.bio,
                url: userData.url
              }
            });
          } else {
            if (mounted) {
              setState({
                isAuthenticated: false,
                isLoading: false,
                user: null
              });
            }
          }
        } else {
          if (mounted) {
            setState({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
          }
        }
      } catch (error) {
        console.error('🔥 Erro na verificação de auth:', error);
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
