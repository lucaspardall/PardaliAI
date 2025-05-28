import { useState, useEffect } from 'react';

interface ReplitUser {
  id: string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  profileImageUrl?: string;
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
    let retryCount = 0;
    const maxRetries = 3;

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
              user: {
                id: userData.id,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                name: userData.firstName && userData.lastName 
                  ? `${userData.firstName} ${userData.lastName}` 
                  : userData.email,
                profileImage: userData.profileImageUrl
              }
            });
          }
        } else if (response.status === 401) {
          console.log('🔄 Token expirado, redirecionando para login...');
          if (mounted) {
            setState({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
          }
        } else {
          throw new Error(`Status: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Tentativa ${retryCount}/${maxRetries}...`);
          setTimeout(() => checkAuth(), 1000 * retryCount);
          return;
        }

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

    const interval = setInterval(checkAuth, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
}