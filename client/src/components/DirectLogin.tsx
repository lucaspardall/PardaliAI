
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import EmailAuth from './auth/EmailAuth';

function DirectLogin() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'replit' | 'email'>('replit');

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!authLoading && user) {
      console.log('Usuário já autenticado, redirecionando para dashboard...');
      // Delay pequeno para evitar problemas de renderização
      setTimeout(() => {
        setLocation('/dashboard');
      }, 100);
    }
  }, [user, authLoading, setLocation]);

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

  // Modal unificado com as duas opções
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Entre no CIP Shopee</CardTitle>
        <CardDescription className="text-center">
          {authMethod === 'email' ? 'Entre com seu email e senha' : 'Escolha sua forma preferida de entrar'}
        </CardDescription>
        <div className="text-center pt-2">
          <a href="/landing" className="text-sm text-muted-foreground hover:text-primary">
            ← Voltar para a página inicial
          </a>
        </div>
      </CardHeader>

      {authMethod === 'email' ? (
        // Formulário de email/senha
        <div className="px-6 pb-6">
          <EmailAuth onSuccess={() => {
            setLocation('/dashboard');
          }} />
          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setAuthMethod('replit')}
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Outras opções de login
            </Button>
          </div>
        </div>
      ) : (
        // Tela principal com opções
        <>
          <CardContent className="space-y-4">
            {/* Opção 1: Entrar com Gmail (Replit Auth por trás) */}
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <i className="ri-google-fill mr-3 text-lg"></i>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">Continuar com Google</span>
                      <span className="text-xs opacity-90">Login rápido e seguro</span>
                    </div>
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                🚀 Método mais rápido • Sem senhas • Recomendado
              </p>
            </div>

            {/* Divisor */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">
                  ou use
                </span>
              </div>
            </div>

            {/* Opção 2: Email/Senha */}
            <Button 
              onClick={() => setAuthMethod('email')}
              variant="outline"
              className="w-full h-12 border-2 hover:bg-gray-50"
              disabled={isLoading}
            >
              <i className="ri-mail-line mr-3 text-lg"></i>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Email e Senha</span>
                <span className="text-xs text-muted-foreground">Login tradicional</span>
              </div>
            </Button>
          </CardContent>

          <CardFooter className="bg-gray-50/50 rounded-b-lg">
            <div className="w-full text-center">
              <p className="text-xs text-muted-foreground">
                <i className="ri-shield-check-line mr-1"></i>
                Seus dados estão protegidos e criptografados
              </p>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default DirectLogin;
