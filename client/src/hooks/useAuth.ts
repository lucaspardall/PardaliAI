
<old_str>import { useState, useEffect } from 'react';

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

        // Primeiro tenta o endpoint do nosso servidor
        let response = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        // Se falhar, tenta o endpoint nativo do Replit
        if (!response.ok) {
          response = await fetch('/__replauthuser', {
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          });
        }

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
}</old_str>
<new_str>import { useState, useEffect } from 'react';

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

        // Tenta nosso endpoint primeiro
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
          // Token expirado ou usuário não autenticado
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
        
        // Retry logic
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

    // Refresh auth periodically
    const interval = setInterval(checkAuth, 5 * 60 * 1000); // 5 minutos

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
}</new_str>
