
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Zap, TrendingUp, CheckCircle, AlertCircle, Mail, Lock } from 'lucide-react';
import { Link } from 'wouter';

export default function ReplitLoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'idle' | 'opening' | 'authenticating' | 'redirecting'>('idle');
  const [loginMethod, setLoginMethod] = useState<'replit' | 'email'>('replit');
  
  // Estado para login com email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLoginWithReplit = () => {
    setIsLoading(true);
    setLoginStep('opening');

    toast({
      title: "🚀 Iniciando autenticação",
      description: "Abrindo janela segura do Replit...",
    });

    window.addEventListener("message", authComplete);
    const h = 650;
    const w = 450;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    const authWindow = window.open(
      "/api/login",
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

    if (!authWindow) {
      setIsLoading(false);
      setLoginStep('idle');
      toast({
        title: "❌ Popup bloqueado",
        description: "Permita popups para este site e tente novamente.",
        variant: "destructive"
      });
      return;
    }

    setLoginStep('authenticating');

    const timeoutId = setTimeout(() => {
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
      setIsLoading(false);
      setLoginStep('idle');
      window.removeEventListener("message", authComplete);
      toast({
        title: "⏰ Tempo limite excedido",
        description: "Tente fazer login novamente.",
        variant: "destructive"
      });
    }, 45000);

    function authComplete(e: MessageEvent) {
      if (e.data !== "auth_complete") {
        return;
      }

      clearTimeout(timeoutId);
      setLoginStep('redirecting');
      window.removeEventListener("message", authComplete);

      if (authWindow) {
        authWindow.close();
      }

      toast({
        title: "✅ Autenticação realizada!",
        description: "Redirecionando para o dashboard...",
      });

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
      const body: any = { email, password };
      
      if (isRegisterMode) {
        if (password !== confirmPassword) {
          toast({
            title: "❌ Erro de validação",
            description: "As senhas não coincidem.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        body.confirmPassword = confirmPassword;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Login realizado!",
          description: isRegisterMode ? "Conta criada com sucesso!" : "Bem-vindo de volta!",
        });

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        toast({
          title: "❌ Erro no login",
          description: data.message || "Credenciais inválidas.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = () => {
    switch (loginStep) {
      case 'opening':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'authenticating':
        return <Shield className="h-5 w-5 animate-pulse text-orange-500" />;
      case 'redirecting':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepText = () => {
    switch (loginStep) {
      case 'opening':
        return "Abrindo janela de autenticação...";
      case 'authenticating':
        return "Aguardando confirmação no Replit...";
      case 'redirecting':
        return "Login realizado! Redirecionando...";
      default:
        return "Pronto para fazer login";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo e Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <i className="ri-bird-fill text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            CIP Shopee
          </h1>
          <p className="text-gray-600">Entre na sua conta para continuar</p>
        </div>

        {/* Card Principal */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Fazer Login</CardTitle>
            <CardDescription>
              Escolha como deseja acessar sua conta
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            
            <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'replit' | 'email')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="replit" className="flex items-center gap-2">
                  <i className="ri-replit-fill text-sm"></i>
                  Replit
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="replit" className="space-y-4">
                {/* Status do Login Replit */}
                <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  {getStepIcon()}
                  <span className="text-sm font-medium text-gray-700">
                    {getStepText()}
                  </span>
                </div>

                {/* Botão Replit */}
                <Button 
                  onClick={handleLoginWithReplit}
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {loginStep === 'redirecting' ? 'Redirecionando...' : 'Autenticando...'}
                    </>
                  ) : (
                    <>
                      <i className="ri-replit-fill mr-2 text-lg"></i>
                      Entrar com Replit
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {isRegisterMode && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isRegisterMode ? 'Criando conta...' : 'Entrando...'}
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        {isRegisterMode ? 'Criar Conta' : 'Entrar'}
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(!isRegisterMode)}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      disabled={isLoading}
                    >
                      {isRegisterMode 
                        ? 'Já tem uma conta? Faça login' 
                        : 'Não tem conta? Crie uma agora'
                      }
                    </button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>

            {/* Informações de Segurança */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Autenticação 100% segura</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Acesso instantâneo ao dashboard</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span>Otimize produtos com IA</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-4 border-t">
            <div className="w-full text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                ← Voltar para página inicial
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Dicas de Uso */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-blue-900">Primeira vez aqui?</h4>
                <p className="text-xs text-blue-700">
                  Após o login, você poderá conectar sua loja Shopee e começar a otimizar produtos imediatamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
