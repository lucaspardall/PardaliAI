
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="ri-shopping-bag-3-line text-primary-foreground text-2xl"></i>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Entre no CIP Shopee
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                {authMethod === 'email' ? 'Entre com seu email e senha' : 'Escolha sua forma preferida de entrar'}
              </CardDescription>
            </div>
          </div>
          <div className="text-center">
            <a 
              href="/landing" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group"
            >
              <i className="ri-arrow-left-line mr-2 group-hover:-translate-x-1 transition-transform duration-200"></i>
              Voltar para a página inicial
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
            <CardContent className="space-y-6 px-8 pb-8">
              {/* Opção 1: Entrar com Gmail (Replit Auth por trás) */}
              <div className="space-y-4">
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="w-full h-14 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span className="font-semibold">Conectando...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-google-fill mr-4 text-xl"></i>
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-base">Continuar com Google</span>
                        <span className="text-xs opacity-90 font-medium">Login rápido e seguro</span>
                      </div>
                    </>
                  )}
                </Button>
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-muted/30 rounded-lg py-3 px-4">
                  <i className="ri-rocket-line text-primary"></i>
                  <span>Método mais rápido • Sem senhas • Recomendado</span>
                </div>
              </div>

              {/* Divisor elegante */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 py-1 text-xs uppercase font-semibold text-muted-foreground tracking-wider border border-border/40 rounded-full">
                    ou continue com
                  </span>
                </div>
              </div>

              {/* Opção 2: Email/Senha */}
              <Button 
                onClick={() => setAuthMethod('email')}
                variant="outline"
                className="w-full h-14 border-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                disabled={isLoading}
              >
                <i className="ri-mail-line mr-4 text-xl text-primary"></i>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-base">Email e Senha</span>
                  <span className="text-xs text-muted-foreground font-medium">Login tradicional</span>
                </div>
              </Button>
            </CardContent>

            <CardFooter className="bg-muted/30 rounded-b-lg px-8 py-6 border-t border-border/30">
              <div className="w-full text-center">
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <i className="ri-shield-check-line text-green-600"></i>
                  <span className="font-medium">Seus dados estão protegidos e criptografados</span>
                </div>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}

export default DirectLogin;
