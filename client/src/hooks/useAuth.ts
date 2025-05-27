import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { useToast } from './use-toast';

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  plan?: string;
  planStatus?: string;
  aiCreditsLeft?: number;
  storeLimit?: number;
}

async function fetchUserData(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Casos de não autenticado
    if (response.status === 401 || response.status === 302) {
      return null;
    }

    if (!response.ok) {
      console.warn(`Auth API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    // Verificar se a resposta tem conteúdo
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Auth API did not return JSON');
      return null;
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      console.warn('Auth API returned empty response');
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.warn('Failed to parse auth response as JSON:', text.substring(0, 100));
      return null;
    }

  } catch (error) {
    // Não logar erros de rede como críticos se for problema de autenticação
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error during auth check');
      return null;
    }
    
    console.warn('Auth check failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export function useAuth() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user: clerkUser } = useUser();

  // Buscar dados adicionais do backend apenas se estiver autenticado
  const { data: userData, isLoading: isLoadingData, refetch } = useQuery({
    queryKey: ['auth', 'user-data'],
    queryFn: fetchUserData,
    enabled: isSignedIn && isLoaded,
    retry: (failureCount, error) => {
      // Não fazer retry para erros de autenticação
      if (error instanceof Error && (
        error.message.includes('401') || 
        error.message.includes('403') ||
        error.message.includes('Network error')
      )) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const isLoading = !isLoaded || (isSignedIn && isLoadingData);

  // Redirecionamento automático
  useEffect(() => {
    if (isLoaded && isSignedIn && userData && location === '/') {
      console.log('Usuário autenticado, redirecionando para dashboard');
      setLocation('/dashboard');
    }
  }, [isLoaded, isSignedIn, userData, location, setLocation]);

  const fullName = userData 
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
    : clerkUser 
    ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
    : '';

  return {
    user: isSignedIn && userData ? {
      ...userData,
      name: fullName || userData.email || clerkUser?.emailAddresses[0]?.emailAddress || 'Usuário',
      picture: userData.profileImageUrl || clerkUser?.imageUrl
    } : null,
    isAuthenticated: isSignedIn,
    isLoading,
    error: null,
    refetch,
  };
}