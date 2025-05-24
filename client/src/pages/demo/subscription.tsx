
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, CreditCard, Star, Clock, AlertCircle } from 'lucide-react';

export default function DemoSubscription() {
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
          <h2 className="text-xl font-semibold mb-2">Carregando assinatura...</h2>
          <p className="text-muted-foreground">Preparando dados simulados</p>
        </div>
      </div>
    );
  }

  const currentPlan = demoUser?.plan || 'enterprise';

  return (
    <SidebarLayout
      user={demoUser}
      stores={[]}
      notifications={[]}
      demoMode={true}
      title="Assinatura"
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Assinatura</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu plano e métodos de pagamento
            </p>
          </div>
          <Button onClick={() => navigate('/demo/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Seu Plano Atual</CardTitle>
                <CardDescription>Detalhes do seu plano de assinatura</CardDescription>
              </div>
              <Badge className="bg-primary">
                {currentPlan === 'free' ? 'Gratuito' : 
                 currentPlan === 'starter' ? 'Starter' : 
                 currentPlan === 'pro' ? 'Pro' : 'Enterprise'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <p className="font-medium">Cobrança</p>
                  <p className="text-sm text-muted-foreground">Mensal</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <p className="font-medium">Próxima cobrança</p>
                  <p className="text-sm text-muted-foreground">15/06/2025</p>
                </div>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">Ativo</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" disabled={true}>
              Cancelar Plano (Demo)
            </Button>
            <Button disabled={true}>
              Alterar Plano (Demo)
            </Button>
          </CardFooter>
        </Card>

        <Tabs defaultValue="plans">
          <TabsList className="mb-6">
            <TabsTrigger value="plans">Planos Disponíveis</TabsTrigger>
            <TabsTrigger value="payment">Métodos de Pagamento</TabsTrigger>
            <TabsTrigger value="history">Histórico de Faturas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className={`border-2 ${currentPlan === 'free' ? 'border-primary' : 'border-border'}`}>
                <CardHeader>
                  <CardTitle>Gratuito</CardTitle>
                  <CardDescription>Para começar</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">R$ 0</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>1 loja conectada</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>100 produtos</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Relatórios básicos</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Suporte por email</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={currentPlan === 'free' ? 'secondary' : 'outline'} 
                    className="w-full"
                    disabled={true}
                  >
                    {currentPlan === 'free' ? 'Plano Atual' : 'Escolher Plano (Demo)'}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className={`border-2 ${currentPlan === 'starter' ? 'border-primary' : 'border-border'}`}>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>Para pequenos negócios</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">R$ 99</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>3 lojas conectadas</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>500 produtos</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Relatórios avançados</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Suporte prioritário</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Otimizações básicas com IA</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={currentPlan === 'starter' ? 'secondary' : 'outline'} 
                    className="w-full"
                    disabled={true}
                  >
                    {currentPlan === 'starter' ? 'Plano Atual' : 'Escolher Plano (Demo)'}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className={`border-2 ${currentPlan === 'pro' || currentPlan === 'enterprise' ? 'border-primary' : 'border-border'}`}>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Para grandes operações</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">R$ 399</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Lojas ilimitadas</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Produtos ilimitados</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Relatórios personalizados</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Suporte 24/7</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Otimizações avançadas com IA</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>API e integrações</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      <span>Gerenciador de conta dedicado</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={currentPlan === 'pro' || currentPlan === 'enterprise' ? 'secondary' : 'outline'} 
                    className="w-full"
                    disabled={true}
                  >
                    {currentPlan === 'pro' || currentPlan === 'enterprise' ? 'Plano Atual' : 'Escolher Plano (Demo)'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>Gerencie seus métodos de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-4">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Cartão de crédito</p>
                        <p className="text-sm text-muted-foreground">**** **** **** 4242 (Visa)</p>
                        <p className="text-xs text-muted-foreground">Expira em 12/2026</p>
                      </div>
                    </div>
                    <Badge>Padrão</Badge>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-4">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Cartão de crédito</p>
                        <p className="text-sm text-muted-foreground">**** **** **** 5555 (Mastercard)</p>
                        <p className="text-xs text-muted-foreground">Expira em 08/2025</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" disabled={true}>Definir como padrão</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" disabled={true}>
                  Adicionar Novo Método (Demo)
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Faturas</CardTitle>
                <CardDescription>Veja e baixe suas faturas anteriores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Fatura #INV-2025-001</p>
                      <p className="text-sm text-muted-foreground">15/05/2025 - Plano Enterprise</p>
                      <p className="text-sm">R$ 399,00</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">Pago</Badge>
                      <Button variant="outline" size="sm" disabled={true}>
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Fatura #INV-2025-000</p>
                      <p className="text-sm text-muted-foreground">15/04/2025 - Plano Enterprise</p>
                      <p className="text-sm">R$ 399,00</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">Pago</Badge>
                      <Button variant="outline" size="sm" disabled={true}>
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Fatura #INV-2024-023</p>
                      <p className="text-sm text-muted-foreground">15/03/2025 - Plano Pro</p>
                      <p className="text-sm">R$ 199,00</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">Pago</Badge>
                      <Button variant="outline" size="sm" disabled={true}>
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
