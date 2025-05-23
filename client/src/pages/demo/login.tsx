import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

// Componentes UI
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Esquema de validação do formulário
const formSchema = z.object({
  username: z.string().min(1, { message: 'Nome de usuário é obrigatório' }),
  password: z.string().min(1, { message: 'Senha é obrigatória' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function DemoLogin() {
  const [, navigate] = useLocation();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  // Formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Enviar formulário - versão cliente para demonstração
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);

    // Credenciais fixas para demonstração
    if (data.username === 'testeshopee' && data.password === 'ShopeeTest2025!') {
      // Simular tempo de processamento para feedback visual
      setTimeout(() => {
        // Salvar no localStorage para manter usuário "logado"
        localStorage.setItem('demo_user', JSON.stringify({
          id: 'demo-user-123',
          email: 'demo@cipshopee.com',
          firstName: 'Demo',
          lastName: 'Usuário',
          profileImageUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=FF5722&color=fff',
          plan: 'premium',
          planStatus: 'active',
          aiCreditsLeft: 500,
          storeLimit: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        localStorage.setItem('demo_logged_in', 'true');
        
        // Notificação de sucesso
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao modo de demonstração do CIP Shopee!',
        });
        
        // Redirecionar para o dashboard
        setTimeout(() => {
          window.location.href = '/demo/dashboard';
        }, 1000);
      }, 800);
    } else {
      setTimeout(() => {
        setError('Credenciais de demonstração inválidas');
        setIsLoading(false);
      }, 800);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Acesso de Demonstração
          </CardTitle>
          <CardDescription className="text-center">
            Entre com as credenciais de demonstração para acessar o CIP Shopee
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="testeshopee" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>Credenciais para o modo de demonstração:</p>
            <p className="font-medium">Usuário: testeshopee</p>
            <p className="font-medium">Senha: ShopeeTest2025!</p>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            <p>Este é um ambiente de demonstração do CIP Shopee com dados simulados.</p>
            <p>Nenhuma loja ou produto real será afetado.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}