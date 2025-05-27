
import { useUser } from '@clerk/clerk-react';
import { useMemo } from 'react';

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

export const useAuth = () => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  const user: User | null = useMemo(() => {
    if (!clerkUser) return null;
    
    return {
      id: clerkUser.id,
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
      email: clerkUser.primaryEmailAddress?.emailAddress || undefined,
      profileImageUrl: clerkUser.imageUrl || undefined,
      plan: clerkUser.publicMetadata?.plan as string || 'free',
      planStatus: clerkUser.publicMetadata?.planStatus as string || 'active',
      aiCreditsLeft: clerkUser.publicMetadata?.aiCreditsLeft as number || 10,
      storeLimit: clerkUser.publicMetadata?.storeLimit as number || 1,
    };
  }, [clerkUser]);

  return {
    user,
    isLoading: !isLoaded,
    isAuthenticated: !!isSignedIn && !!clerkUser,
  };
};
