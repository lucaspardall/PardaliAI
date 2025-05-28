
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import EmailAuth from './auth/EmailAuth';

export default function DirectLogin() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'replit' | 'email'>('replit');

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!authLoading && user) {
      console.log('Usuário já autenticado, redirecionando para dashboard...');
      setLocation('/dashboard');
    }
  }, [user, authLoading, setLocation]);

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

      setIsLoading(false);
      window.removeEventListener("message", authComplete);

      if (authWindow) {
        authWindow.close();
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      });

      // Pequeno delay para mostrar o toast
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    }
  };

  const handleSimpleLogin = () => {
    setAuthMethod('email');
  };

  // Loading state enquanto verifica autenticação
  if (authLoading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificando autenticação...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se usuário já está autenticado, não mostrar login
  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecionando...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Você já está logado como {user.firstName}. Redirecionando para o dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar EmailAuth se selecionado
  if (authMethod === 'email') {
    return (
      <div className="w-full max-w-md mx-auto mt-8 space-y-4">
        <EmailAuth />
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAuthMethod('replit')}
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Voltar para login Replit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de login padrão
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Entrar no CIP Shopee</CardTitle>
        <CardDescription>
          Escolha como você quer fazer login na plataforma.
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
        <div className="text-xs text-center text-muted-foreground mb-2">
          <strong>Opção 1:</strong> Login com Replit
        </div>
        
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
              Replit (Pop-up)
            </>
          )}
        </Button>

        <Button 
          onClick={() => window.location.href = "/api/login"}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          <i className="ri-replit-fill mr-2"></i>
          Replit (Redirecionamento)
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              <strong>Opção 2:</strong> Login tradicional
            </span>
          </div>
        </div>

        <Button 
          onClick={() => setAuthMethod('email')}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          <i className="ri-mail-line mr-2"></i>
          Entrar com Email e Senha
        </Button>
      </CardFooter>
    </Card>
  );
}
