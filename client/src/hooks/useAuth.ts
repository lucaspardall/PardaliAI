import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();

  // Buscar dados do usuário do nosso backend
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', clerkUser?.id],
    queryFn: async () => {
      if (!clerkUser?.id) return null;

      try {
        const token = await getToken();
        
        if (!token) {
          console.warn('⚠️ Token Clerk não disponível');
          return null;
        }

        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.warn('⚠️ Usuário não autenticado no backend');
            return null;
          }
          const errorText = await response.text();
          console.error(`❌ Erro auth: ${response.status} - ${errorText}`);
          throw new Error(`HTTP ${response.status}`);
        }

        const userData = await response.json();
        console.log('✅ Usuário autenticado:', userData?.email);
        return userData;
      } catch (error) {
        console.error('❌ Erro ao buscar dados do usuário:', error);
        return null;
      }
    },
    enabled: !!clerkUser?.id && isSignedIn,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const user = userData || {
    id: clerkUser?.id,
    email: clerkUser?.emailAddresses?.[0]?.emailAddress,
    name: clerkUser?.fullName || clerkUser?.firstName,
    plan: 'free',
    aiCreditsLeft: 10,
    storeLimit: 1,
  };

  return {
    user: isSignedIn ? user : null,
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded || (isSignedIn && userLoading),
    getToken,
  };
}