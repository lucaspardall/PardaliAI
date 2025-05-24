
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Store, ShoppingBag, BarChart3, Settings, Package } from 'lucide-react';

export default function DemoStore() {
  const [, navigate] = useLocation();
  const [demoUser, setDemoUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('demo_logged_in');
      const userData = localStorage.getItem('demo_user');
      
      if (isLoggedIn === 'true' && userData) {
        try {
          const user = JSON.parse(userData);
          setDemoUser(user);
          
          // Dados de demonstração para lojas
          setStores([
            {
              id: 1,
              shopId: 'S12345678',
              shopName: 'Tech Store Demo',
              shopLogo: 'https://ui-avatars.com/api/?name=Tech+Store&background=0D8ABC&color=fff',
              shopRegion: 'BR',
              totalProducts: 145,
              totalOrders: 532,
              monthlyRevenue: 24567.89,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 2,
              shopId: 'S87654321',
              shopName: 'Fashion Demo',
              shopLogo: 'https://ui-avatars.com/api/?name=Fashion+Demo&background=FF5722&color=fff',
              shopRegion: 'BR',
              totalProducts: 87,
              totalOrders: 321,
              monthlyRevenue: 18543.21,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]);
          
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
          <h2 className="text-xl font-semibold mb-2">Carregando informações das lojas...</h2>
          <p className="text-muted-foreground">Preparando dados simulados da Shopee</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout
      user={demoUser}
      stores={stores}
      notifications={[]}
      demoMode={true}
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Minhas Lojas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas lojas conectadas à Shopee
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/demo/dashboard')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/demo/products')}>
              <Package className="mr-2 h-4 w-4" />
              Produtos
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {stores.map((store) => (
            <Card key={store.id} className="overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <img src={store.shopLogo} alt={store.shopName} />
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {store.shopName}
                      <Badge variant="outline" className="ml-2">
                        {store.shopRegion}
                      </Badge>
                      {store.isActive && (
                        <Badge className="bg-green-500">Ativo</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">ID: {store.shopId}</p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/demo/products')}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Ver Produtos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/demo/dashboard')}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="info">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{store.totalProducts}</div>
                          <p className="text-xs text-muted-foreground">Total de produtos cadastrados</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{store.totalOrders}</div>
                          <p className="text-xs text-muted-foreground">Total de pedidos realizados</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">R$ {store.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          <p className="text-xs text-muted-foreground">Receita do mês atual</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Detalhes da Loja</h3>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">ID da Loja</TableCell>
                            <TableCell>{store.shopId}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Nome</TableCell>
                            <TableCell>{store.shopName}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Região</TableCell>
                            <TableCell>{store.shopRegion}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Status</TableCell>
                            <TableCell>
                              {store.isActive ? (
                                <Badge className="bg-green-500">Ativo</Badge>
                              ) : (
                                <Badge variant="destructive">Inativo</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Data de Conexão</TableCell>
                            <TableCell>{store.createdAt.toLocaleDateString('pt-BR')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Última Atualização</TableCell>
                            <TableCell>{store.updatedAt.toLocaleDateString('pt-BR')}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stats">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h3 className="text-lg font-semibold mb-2">Estatísticas Indisponíveis</h3>
                        <p className="text-muted-foreground">
                          As estatísticas detalhadas desta loja estão disponíveis no Dashboard. 
                          Clique no botão abaixo para visualizar.
                        </p>
                        <Button className="mt-4" onClick={() => navigate('/demo/dashboard')}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Ver Dashboard
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h3 className="text-lg font-semibold mb-2">Configurações da Loja</h3>
                        <p className="text-muted-foreground">
                          Este é um ambiente de demonstração. Em uma conta real, você poderia
                          configurar preferências de sincronização, notificações e permissões.
                        </p>
                        <Button className="mt-4" variant="outline">
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações (Demonstração)
                        </Button>
                      </div>
                      
                      <div className="rounded-lg border p-4 bg-destructive/5">
                        <h3 className="text-lg font-semibold mb-2 text-destructive">Desconectar Loja</h3>
                        <p className="text-muted-foreground">
                          Desconectar esta loja removerá o acesso às informações e funcionalidades
                          relacionadas à Shopee. Esta ação não afeta sua loja na plataforma Shopee.
                        </p>
                        <Button className="mt-4" variant="destructive">
                          Desconectar (Demonstração)
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
          
          <Card className="border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Store className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Conectar Nova Loja</h3>
              <p className="text-center text-muted-foreground mb-4">
                Conecte mais lojas da Shopee para gerenciar todos os seus produtos em um só lugar.
              </p>
              <Button onClick={() => navigate('/demo/dashboard')}>
                Adicionar Loja (Demonstração)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
