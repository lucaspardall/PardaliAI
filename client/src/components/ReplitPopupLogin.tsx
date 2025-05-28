
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

interface ReplitPopupLoginProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ReplitPopupLogin({ 
  className = "", 
  variant = "default",
  size = "default",
  children,
  onSuccess,
  onError
}: ReplitPopupLoginProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePopupLogin = () => {
    setIsLoading(true);

    window.addEventListener("message", authComplete);
    
    // Popup otimizado
    const h = 500;
    const w = 400;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    const authWindow = window.open(
      "/api/login",
      "replitAuth",
      `modal=yes,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,copyhistory=no,width=${w},height=${h},top=${top},left=${left}`
    );

    if (!authWindow) {
      setIsLoading(false);
      const errorMsg = "Popup bloqueado pelo navegador";
      onError?.(errorMsg);
      toast({
        title: "🚫 Popup bloqueado",
        description: "Permita popups e tente novamente",
        variant: "destructive"
      });
      return;
    }

    // Monitorar fechamento manual
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
        window.removeEventListener("message", authComplete);
      }
    }, 1000);

    // Timeout
    const timeoutId = setTimeout(() => {
      clearInterval(checkClosed);
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
      setIsLoading(false);
      window.removeEventListener("message", authComplete);
      const errorMsg = "Timeout no login";
      onError?.(errorMsg);
      toast({
        title: "⏰ Tempo esgotado",
        description: "Tente novamente",
        variant: "destructive"
      });
    }, 60000);

    function authComplete(e: MessageEvent) {
      if (e.data !== "auth_complete") {
        return;
      }

      clearTimeout(timeoutId);
      clearInterval(checkClosed);
      window.removeEventListener("message", authComplete);

      if (authWindow) {
        authWindow.close();
      }

      setIsLoading(false);
      onSuccess?.();
      
      toast({
        title: "✅ Login realizado!",
        description: "Bem-vindo ao CIP Shopee",
      });

      // Se não tem callback customizado, redireciona
      if (!onSuccess) {
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);
      }
    }
  };

  return (
    <Button 
      onClick={handlePopupLogin}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Autenticando...
        </>
      ) : (
        <>
          {children || (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Entrar com Replit
            </>
          )}
        </>
      )}
    </Button>
  );
}
