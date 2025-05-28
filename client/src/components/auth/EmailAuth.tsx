
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface EmailAuthProps {
  onSuccess?: () => void;
}

export default function EmailAuth({ onSuccess }: EmailAuthProps) {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: isLogin ? 'Login realizado!' : 'Conta criada!',
          description: data.message,
        });
        
        // Aguardar um pouco para o cookie ser definido
        setTimeout(() => {
          onSuccess?.();
          window.location.href = '/dashboard';
        }, 500);
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Algo deu errado',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro de conexão. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isLogin ? 'Entrar' : 'Criar conta'}
        </CardTitle>
        <CardDescription>
          {isLogin 
            ? 'Entre com seu email e senha' 
            : 'Crie uma conta para começar a usar o CIP Shopee'
          }
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    placeholder="Seu nome"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required={!isLogin}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    placeholder="Seu sobrenome"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </div>
            </>
          )}
          
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                placeholder="Seu nome de usuário"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">{isLogin ? 'Email ou nome de usuário' : 'Email'}</Label>
            <Input
              id="email"
              type={isLogin ? "text" : "email"}
              placeholder={isLogin ? "seu@email.com ou seu_usuario" : "seu@email.com"}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isLogin ? 'Sua senha' : 'Mínimo 6 caracteres'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                minLength={isLogin ? 1 : 6}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLogin ? 'Entrando...' : 'Criando conta...'}
              </>
            ) : (
              <>
                <i className={`mr-2 ${isLogin ? 'ri-login-box-line' : 'ri-user-add-line'}`}></i>
                {isLogin ? 'Entrar' : 'Criar conta'}
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setIsLogin(!isLogin)}
            disabled={isLoading}
          >
            {isLogin ? (
              <>
                Não tem conta? <span className="ml-1 font-semibold">Criar conta</span>
              </>
            ) : (
              <>
                Já tem conta? <span className="ml-1 font-semibold">Entrar</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
