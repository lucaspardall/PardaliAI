
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { Link } from 'wouter';

export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'replit'>('email');
  
  // Estados para login por email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Estados para login Replit
  const [replitStep, setReplitStep] = useState<'idle' | 'opening' | 'authenticating' | 'success'>('idle');

  // Validações em tempo real
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email é obrigatório';
    if (!emailRegex.test(email)) return 'Email inválido';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Senha é obrigatória';
    if (password.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
    return '';
  };

  useEffect(() => {
    if (email) setEmailError(validateEmail(email));
  }, [email]);

  useEffect(() => {
    if (password) setPasswordError(validatePassword(password));
  }, [password]);

  // Login por Email/Senha
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    
    if (emailErr || passwordErr) {
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      toast({
        title: "❌ Senhas não coincidem",
        description: "Verifique se as senhas são iguais",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
      const body = isRegisterMode 
        ? { email, password, confirmPassword }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Sucesso!",
          description: isRegisterMode ? "Conta criada com sucesso!" : "Login realizado com sucesso!",
        });

        // Redirecionamento suave
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        toast({
          title: "❌ Erro",
          description: data.message || 'Erro desconhecido',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "❌ Erro de conexão",
        description: "Verifique sua conexão e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Login com Replit
  const handleReplitLogin = () => {
    setIsLoading(true);
    setReplitStep('opening');

    toast({
      title: "🚀 Abrindo Replit...",
      description: "Janela de autenticação segura",
    });

    window.addEventListener("message", handleReplitCallback);
    
    const h = 550;
    const w = 450;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    const authWindow = window.open(
      "/api/login",
      "replitAuth",
      `modal=yes,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,copyhistory=no,width=${w},height=${h},top=${top},left=${left}`
    );

    if (!authWindow) {
      setIsLoading(false);
      setReplitStep('idle');
      toast({
        title: "🚫 Popup bloqueado",
        description: "Permita popups e tente novamente",
        variant: "destructive"
      });
      return;
    }

    setReplitStep('authenticating');

    // Monitorar fechamento da janela
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        cleanupReplitLogin();
        if (replitStep === 'authenticating') {
          toast({
            title: "⚠️ Login cancelado",
            description: "Janela foi fechada",
            variant: "default"
          });
        }
      }
    }, 1000);

    // Timeout de segurança
    setTimeout(() => {
      clearInterval(checkClosed);
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
      cleanupReplitLogin();
    }, 60000);
  };

  const handleReplitCallback = (e: MessageEvent) => {
    if (e.data !== "auth_complete") return;
    
    setReplitStep('success');
    cleanupReplitLogin();
    
    toast({
      title: "✅ Login Replit concluído!",
      description: "Redirecionando para o dashboard...",
    });

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1200);
  };

  const cleanupReplitLogin = () => {
    setIsLoading(false);
    setReplitStep('idle');
    window.removeEventListener("message", handleReplitCallback);
  };

  const getReplitButtonContent = () => {
    switch (replitStep) {
      case 'opening':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Abrindo janela...
          </>
        );
      case 'authenticating':
        return (
          <>
            <Shield className="mr-2 h-4 w-4 animate-pulse" />
            Aguardando login...
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
            <i className="ri-replit-fill mr-2"></i>
            Entrar com Replit
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            <i className="ri-shopping-bag-3-line text-5xl mb-2 block"></i>
            <h1 className="text-3xl font-bold">CIP Shopee</h1>
          </div>
          <p className="text-gray-600 mt-2">Entre na sua conta para continuar</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Fazer Login</CardTitle>
            <CardDescription>
              Escolha seu método de autenticação preferido
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'email' | 'replit')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email & Senha
                </TabsTrigger>
                <TabsTrigger value="replit" className="flex items-center gap-2">
                  <i className="ri-replit-fill text-sm"></i>
                  Replit
                </TabsTrigger>
              </TabsList>

              {/* Login por Email */}
              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {/* Campo Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Campo Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`pl-10 pr-10 ${passwordError ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Confirmar Senha (apenas no registro) */}
                  {isRegisterMode && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Botão Submit */}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium"
                    disabled={isLoading || !!emailError || !!passwordError}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isRegisterMode ? 'Criando conta...' : 'Entrando...'}
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        {isRegisterMode ? 'Criar Conta' : 'Entrar'}
                      </>
                    )}
                  </Button>

                  {/* Toggle Login/Registro */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setPassword('');
                        setConfirmPassword('');
                        setEmailError('');
                        setPasswordError('');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                      disabled={isLoading}
                    >
                      {isRegisterMode 
                        ? 'Já tem uma conta? Faça login' 
                        : 'Não tem conta? Criar uma nova'}
                    </button>
                  </div>
                </form>
              </TabsContent>

              {/* Login com Replit */}
              <TabsContent value="replit" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <i className="ri-replit-fill text-3xl text-orange-600 mb-2 block"></i>
                    <p className="text-sm text-gray-700">
                      Login rápido e seguro com sua conta Replit
                    </p>
                  </div>

                  <Button 
                    onClick={handleReplitLogin}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium h-12 text-base shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {getReplitButtonContent()}
                  </Button>

                  <p className="text-xs text-gray-500">
                    💡 O login abrirá uma janela popup segura do Replit
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 underline">
                ← Voltar para página inicial
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Rodapé */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Ao fazer login, você concorda com nossos termos de uso
          </p>
        </div>
      </div>
    </div>
  );
}
