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

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      return null; // Usuário não autenticado
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return null;
  }
}

export function useAuth() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Redirecionamento automático para dashboard quando autenticado
  useEffect(() => {
    if (data && location === '/') {
      console.log('Usuário autenticado, redirecionando para dashboard');
      setLocation('/dashboard');
    }
  }, [data, location, setLocation]);

  // Verificar se URL tem parâmetro de login requerido
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'required' && !isLoading && !data) {
      toast({
        title: 'Login necessário',
        description: 'Por favor, faça login para acessar esta página.',
        variant: 'destructive',
      });

      // Remover parâmetro da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location, isLoading, data, toast]);

  // Verificar mensagens de status da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const message = params.get('message');

    if (status && message) {
      const variant = status === 'success' ? 'default' : 'destructive';
      toast({
        title: status === 'success' ? 'Sucesso' : 'Erro',
        description: decodeURIComponent(message),
        variant,
      });

      // Limpar parâmetros da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toast]);

  const fullName = data ? `${data.firstName || ''} ${data.lastName || ''}`.trim() : '';

  return {
    user: data ? {
      ...data,
      name: fullName || data.email || 'Usuário',
      picture: data.profileImageUrl
    } : null,
    isAuthenticated: !!data,
    isLoading,
    error,
    refetch,
  };
}