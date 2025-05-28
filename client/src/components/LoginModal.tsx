
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mail, Lock, User, Chrome, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplitLoading, setIsReplitLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      console.log(`🚀 ${isLogin ? 'Login' : 'Cadastro'} com email:`, formData.email);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: `${isLogin ? 'Login' : 'Cadastro'} realizado!`,
          description: `Bem-vindo${isLogin ? ' de volta' : ''}!`,
        });
        
        // Atualizar contexto de autenticação
        if (login) {
          await login();
        }
        
        onClose();
        window.location.reload(); // Força refresh para garantir estado consistente
      } else {
        throw new Error(data.error || `Erro no ${isLogin ? 'login' : 'cadastro'}`);
      }
    } catch (error) {
      console.error(`❌ Erro no ${isLogin ? 'login' : 'cadastro'}:`, error);
      toast({
        title: `Erro no ${isLogin ? 'login' : 'cadastro'}`,
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplitLogin = async () => {
    setIsReplitLoading(true);
    try {
      console.log('🔐 Iniciando login com Replit...');
      
      // Abrir popup do Replit
      const popup = window.open(
        '/api/auth/replit',
        'replit-login',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup foi bloqueado. Permita popups para este site.');
      }

      // Monitorar popup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsReplitLoading(false);
          
          // Verificar se login foi bem-sucedido
          setTimeout(async () => {
            try {
              const response = await fetch('/api/auth/user', {
                credentials: 'include'
              });
              
              if (response.ok) {
                const userData = await response.json();
                console.log('✅ Login Replit bem-sucedido:', userData);
                
                toast({
                  title: "Login realizado!",
                  description: `Bem-vindo, ${userData.firstName}!`,
                });
                
                if (login) {
                  await login();
                }
                
                onClose();
                window.location.reload();
              }
            } catch (error) {
              console.log('ℹ️ Login cancelado ou falhou');
            }
          }, 1000);
        }
      }, 1000);

      // Timeout de segurança
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          setIsReplitLoading(false);
        }
      }, 300000); // 5 minutos

    } catch (error) {
      console.error('❌ Erro no login Replit:', error);
      toast({
        title: "Erro no login Replit",
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: "destructive",
      });
      setIsReplitLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <Shield className="h-5 w-5 text-blue-600" />
            {isLogin ? 'Entrar na sua conta' : 'Criar conta'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Login com Replit */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <Button
                onClick={handleReplitLogin}
                disabled={isReplitLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isReplitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Chrome className="mr-2 h-4 w-4" />
                    Continuar com Replit
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Rápido e seguro
              </p>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou continue com email
              </span>
            </div>
          </div>

          {/* Login com Email */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      placeholder="João"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    placeholder="Silva"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Entrando...' : 'Criando conta...'}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isLogin ? 'Entrar' : 'Criar conta'}
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: '', password: '', firstName: '', lastName: '' });
              }}
              className="text-sm"
            >
              {isLogin 
                ? 'Não tem conta? Criar uma agora' 
                : 'Já tem conta? Fazer login'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
