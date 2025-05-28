
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [loginStep, setLoginStep] = useState<'idle' | 'opening' | 'authenticating' | 'success'>('idle');

  const handlePopupLogin = () => {
    setIsLoading(true);
    setLoginStep('opening');

    // Toast com visual aprimorado
    toast({
      title: "🚀 Iniciando login...",
      description: "Abrindo janela segura do Replit",
    });

    window.addEventListener("message", authComplete);
    
    // Popup otimizado com melhor posicionamento
    const h = 500;
    const w = 420;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    const authWindow = window.open(
      "/api/login",
      "replitAuth",
      `modal=yes,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,copyhistory=no,width=${w},height=${h},top=${top},left=${left}`
    );

    if (!authWindow) {
      setIsLoading(false);
      setLoginStep('idle');
      const errorMsg = "Popup foi bloqueado pelo navegador";
      onError?.(errorMsg);
      toast({
        title: "🚫 Popup bloqueado",
        description: "Por favor, permita popups para este site e tente novamente",
        variant: "destructive"
      });
      return;
    }

    // Feedback visual melhorado
    setLoginStep('authenticating');
    toast({
      title: "🔐 Autenticando...",
      description: "Faça login na janela do Replit",
    });

    // Monitorar fechamento manual
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
        setLoginStep('idle');
        window.removeEventListener("message", authComplete);
        
        if (loginStep === 'authenticating') {
          toast({
            title: "⚠️ Login cancelado",
            description: "A janela foi fechada",
            variant: "default"
          });
        }
      }
    }, 1000);

    // Timeout mais generoso
    const timeoutId = setTimeout(() => {
      clearInterval(checkClosed);
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
      setIsLoading(false);
      setLoginStep('idle');
      window.removeEventListener("message", authComplete);
      const errorMsg = "Timeout - login demorou muito";
      onError?.(errorMsg);
      toast({
        title: "⏰ Tempo esgotado",
        description: "O login demorou muito. Tente novamente.",
        variant: "destructive"
      });
    }, 90000); // 1.5 minutos

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

      setLoginStep('success');
      
      // Toast de sucesso mais atrativo
      toast({
        title: "✅ Login realizado com sucesso!",
        description: "Bem-vindo ao CIP Shopee! Redirecionando...",
      });

      // Callback customizado ou redirecionamento padrão
      if (onSuccess) {
        setTimeout(() => {
          setIsLoading(false);
          setLoginStep('idle');
          onSuccess();
        }, 1200);
      } else {
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      }
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      switch (loginStep) {
        case 'opening':
          return (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Abrindo...
            </>
          );
        case 'authenticating':
          return (
            <>
              <Shield className="mr-2 h-4 w-4 animate-pulse" />
              Autenticando...
            </>
          );
        case 'success':
          return (
            <>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Sucesso! Redirecionando...
            </>
          );
        default:
          return (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          );
      }
    }

    return children || (
      <>
        <i className="ri-replit-fill mr-2"></i>
        Entrar com Replit
      </>
    );
  };

  return (
    <Button 
      onClick={handlePopupLogin}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {getButtonContent()}
    </Button>
  );
}
