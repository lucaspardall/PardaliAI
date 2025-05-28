
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
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
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
