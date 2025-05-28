
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { loginWithReplit } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, firstName, lastName };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: isLogin ? "Login realizado!" : "Conta criada!",
          description: isLogin ? "Bem-vindo de volta!" : "Sua conta foi criada com sucesso!",
        });
        onOpenChange(false);
        window.location.reload(); // Recarregar para atualizar estado
      } else {
        throw new Error(data.message || 'Erro desconhecido');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao fazer login',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReplitLogin = () => {
    loginWithReplit();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isLogin ? 'Entrar no CIP Shopee' : 'Criar conta no CIP Shopee'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Login com Replit */}
          <Button 
            onClick={handleReplitLogin}
            className="w-full bg-[#F26207] hover:bg-[#E55A06] text-white font-medium h-11"
          >
            <i className="ri-github-fill mr-2 text-lg"></i>
            Continuar com Replit
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Login com Email */}
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
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    placeholder="Seu nome"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    placeholder="Seu sobrenome"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <i className="ri-loader-2-line animate-spin mr-2"></i>
              ) : null}
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
