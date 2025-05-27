
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function DirectLogin() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginWithReplit = () => {
    setIsLoading(true);
    
    window.addEventListener("message", authComplete);
    const h = 500;
    const w = 350;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    const authWindow = window.open(
      "https://replit.com/auth_with_repl_site?domain=" + location.host,
      "_blank",
      "modal=yes, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" +
        w +
        ", height=" +
        h +
        ", top=" +
        top +
        ", left=" +
        left
    );

    function authComplete(e: MessageEvent) {
      if (e.data !== "auth_complete") {
        return;
      }

      window.removeEventListener("message", authComplete);
      authWindow?.close();
      
      toast({
        title: "Login realizado com sucesso",
        description: "Você está conectado e pode usar o sistema agora.",
        variant: "default",
      });
      
      // Recarregar a página após login bem-sucedido
      setTimeout(() => {
        location.reload();
      }, 1000);
    }

    // Timeout de segurança caso a janela seja fechada manualmente
    setTimeout(() => {
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
      setIsLoading(false);
      window.removeEventListener("message", authComplete);
    }, 60000); // 1 minuto

    // Verificar se a janela foi fechada manualmente
    const checkClosed = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
        window.removeEventListener("message", authComplete);
      }
    }, 1000);
  };

  const handleSimpleLogin = () => {
    // Redirecionamento direto para a rota de login do servidor
    window.location.href = '/api/login';
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Entrar no CIP Shopee</CardTitle>
        <CardDescription>
          Faça login para acessar a plataforma e integrar sua loja Shopee.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <div className="text-center">
          <i className="ri-shopping-bag-3-line text-4xl text-primary mb-3"></i>
          <p className="text-sm text-muted-foreground">
            Use sua conta do Replit para fazer login de forma rápida e segura.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        <Button 
          onClick={handleLoginWithReplit} 
          disabled={isLoading}
          className="w-full bg-[#0E1525] hover:bg-[#1C2333] text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <i className="ri-replit-line mr-2"></i>
              Entrar com Replit (Pop-up)
            </>
          )}
        </Button>
        
        <Button 
          onClick={handleSimpleLogin}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          <i className="ri-login-box-line mr-2"></i>
          Login Direto
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Problemas com pop-ups? Use o "Login Direto" acima.
        </p>
      </CardFooter>
    </Card>
  );
}
