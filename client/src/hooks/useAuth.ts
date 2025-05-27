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

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
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
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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