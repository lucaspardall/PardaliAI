import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  aiCreditsLeft: number;
  storeLimit: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): AuthState & { logout: () => void } {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = () => {
    // Redirecionar para logout que limpa tanto Replit quanto JWT
    console.log('🔄 Iniciando logout do frontend...');
    fetch('/api/logout')
      .then(() => {
        window.location.href = '/landing';
      });
  };

  return {
    user: user || null,
    isAuthenticated: !!user && !error,
    isLoading,
    logout
  };
}