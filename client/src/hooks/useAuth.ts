import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { useToast } from './use-toast';

export interface User {
  id: string;
  name: string;
  email?: string;
  picture?: string;
}

export function useAuth() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    onSuccess: (data) => {
      // Se o usuário estiver autenticado e estiver na página inicial, redirecionar para dashboard
      if (data && location === '/') {
        console.log('Usuário autenticado, redirecionando para dashboard');
        setLocation('/dashboard');
      }
    }
  });

  // Verificar se URL tem parâmetro de login requerido
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'required' && !isLoading && !data) {
      toast({
        title: 'Login necessário',
        description: 'Por favor, faça login para acessar esta página',
        variant: 'destructive',
      });

      // Remover parâmetro da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location, isLoading, data, toast]);

  return {
    user: data as User | null,
    isAuthenticated: !!data,
    isLoading,
    error,
    refetch,
  };
}