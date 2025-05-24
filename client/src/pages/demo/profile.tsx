
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Settings, Shield, Key } from 'lucide-react';

export default function DemoProfile() {
  const [, navigate] = useLocation();
  const [demoUser, setDemoUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('demo_logged_in');
      const userData = localStorage.getItem('demo_user');
      
      if (isLoggedIn === 'true' && userData) {
        try {
          const user = JSON.parse(userData);
          setDemoUser(user);
          setIsLoading(false);
        } catch (error) {
          console.error('Erro ao carregar dados demo:', error);
          navigate('/demo/login');
        }
      } else {
        navigate('/demo/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Carregando perfil...</h2>
          <p className="text-muted-foreground">Preparando dados simulados</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout
      user={demoUser}
      stores={[]}
      notifications={[]}
      demoMode={true}
      title="Perfil"
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Perfil</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas informações pessoais e configurações de conta
            </p>
          </div>
          <Button onClick={() => navigate('/demo/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>

        <Tabs defaultValue="personal">
          <TabsList className="mb-6">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="h-4 w-4 mr-2" />
              Preferências
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Foto de Perfil</CardTitle>
                  <CardDescription>Esta imagem será exibida em seu perfil</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={demoUser?.profileImageUrl || ''} />
                    <AvatarFallback>
                      {demoUser?.firstName?.charAt(0)}{demoUser?.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Trocar imagem</Button>
                    <Button variant="ghost" size="sm">Remover</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Atualize seus dados pessoais</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input 
                          id="firstName" 
                          defaultValue={demoUser?.firstName || "Usuário"} 
                          disabled={true}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input 
                          id="lastName" 
                          defaultValue={demoUser?.lastName || "Demo"} 
                          disabled={true}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        defaultValue={demoUser?.email || "usuario.demo@exemplo.com"} 
                        disabled={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        defaultValue={demoUser?.phone || "(11) 98765-4321"} 
                        disabled={true}
                      />
                    </div>
                    <div className="pt-2">
                      <Button disabled={true}>
                        Salvar Alterações (Demonstração)
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>Gerencie as configurações de segurança da sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Senha
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Sua senha foi alterada pela última vez em 24/05/2025
                  </p>
                  <Button variant="outline" disabled={true}>
                    Alterar Senha (Demonstração)
                  </Button>
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verificação em duas etapas</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione uma camada extra de segurança à sua conta
                  </p>
                  <Button variant="outline" disabled={true}>
                    Configurar 2FA (Demonstração)
                  </Button>
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Dispositivos conectados</h3>
                  <p className="text-muted-foreground mb-4">
                    Gerencie os dispositivos que têm acesso à sua conta
                  </p>
                  <Button variant="outline" disabled={true}>
                    Ver Dispositivos (Demonstração)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
                <CardDescription>Personalize sua experiência na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notificações</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Emails de marketing</p>
                          <p className="text-sm text-muted-foreground">
                            Receba informações sobre novos recursos e ofertas
                          </p>
                        </div>
                        <div>
                          <input 
                            type="checkbox" 
                            id="marketing" 
                            className="form-checkbox h-5 w-5" 
                            defaultChecked={true}
                            disabled={true}
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Alertas de segurança</p>
                          <p className="text-sm text-muted-foreground">
                            Receba alertas sobre atividades suspeitas em sua conta
                          </p>
                        </div>
                        <div>
                          <input 
                            type="checkbox" 
                            id="security" 
                            className="form-checkbox h-5 w-5" 
                            defaultChecked={true}
                            disabled={true}
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Resumos semanais</p>
                          <p className="text-sm text-muted-foreground">
                            Receba um resumo semanal do desempenho da sua loja
                          </p>
                        </div>
                        <div>
                          <input 
                            type="checkbox" 
                            id="weekly" 
                            className="form-checkbox h-5 w-5" 
                            defaultChecked={true}
                            disabled={true}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button disabled={true}>
                        Salvar Preferências (Demonstração)
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
