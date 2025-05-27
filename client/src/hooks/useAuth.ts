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

export const useAuth = () => {
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: () => fetch('/api/auth/status', { credentials: 'include' }).then(res => res.json()),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: authData?.authenticated ? authData.user : null,
    isLoading,
    isAuthenticated: authData?.authenticated || false,
  };
};