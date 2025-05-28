
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function AuthListener() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Detectar mudanças no estado de autenticação
    if (!isLoading && !isAuthenticated) {
      // Usuário não autenticado
      const hasShownWarning = sessionStorage.getItem('auth_warning_shown');
      
      if (!hasShownWarning && window.location.pathname.startsWith('/dashboard')) {
        toast({
          title: "🔐 Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive"
        });
        sessionStorage.setItem('auth_warning_shown', 'true');
      }
    } else if (!isLoading && isAuthenticated) {
      // Usuário autenticado - limpar flag
      sessionStorage.removeItem('auth_warning_shown');
    }
  }, [isAuthenticated, isLoading, toast]);

  return null;
}
