import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Users, TrendingUp, Store, ArrowUp, ArrowDown } from 'lucide-react';

export default function DemoDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  // Estado local para armazenar os dados
  const [demoUser, setDemoUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [storeStats, setStoreStats] = useState<any[]>([]);
  
  // Verificar autenticação e carregar dados do localStorage
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('demo_logged_in');
      const userData = localStorage.getItem('demo_user');
      
      if (isLoggedIn === 'true' && userData) {
        try {
          // Carregar usuário do localStorage
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
              totalOrders: 213,
              monthlyRevenue: 17890.45,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]);
          
          // Dados de demonstração para notificações
          setNotifications([
            {
              id: 1,
              title: 'Bem-vindo ao modo demo',
              message: 'Este é um ambiente de demonstração com dados simulados',
              type: 'info',
              isRead: false,
              createdAt: new Date(),
              userId: user.id
            },
            {
              id: 2,
              title: 'Otimização disponível',
              message: 'Há novas sugestões de otimização para seus produtos',
              type: 'success',
              isRead: false,
              createdAt: new Date(Date.now() - 3600000),
              userId: user.id
            }
          ]);
          
          // Dados de demonstração para estatísticas
          const today = new Date();
          const stats = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            return {
              id: i + 1,
              date: date,
              storeId: 1,
              totalViews: Math.floor(Math.random() * 500) + 100,
              totalSales: Math.floor(Math.random() * 30) + 5,
              totalRevenue: (Math.random() * 2000) + 500,
              averageCtr: (Math.random() * 5) + 1,
              productCount: Math.floor(Math.random() * 10) + 140,
              createdAt: new Date()
            };
          });
          setStoreStats(stats);
        } catch (error) {
          console.error('Erro ao carregar dados demo:', error);
          navigate('/demo/login');
        }
      } else {
        navigate('/demo/login');
      }
      
      setIsLoadingUser(false);
    };
    
    checkAuth();
  }, [navigate]);

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Carregando modo de demonstração...</h2>
          <p className="text-muted-foreground">Preparando dados simulados da Shopee</p>
        </div>
      </div>
    );
  }

  if (!demoUser) {
    return null; // Será redirecionado via useEffect
  }

  // Dados para gráficos e cards de visão geral
  const revenueData = storeStats ? storeStats.map((stat) => ({
    name: new Date(stat.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    valor: stat.totalRevenue,
  })) : [];

  const salesData = storeStats ? storeStats.map((stat) => ({
    name: new Date(stat.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    vendas: stat.totalSales,
  })) : [];

  const categoryData = [
    { name: 'Smartphones', value: 42 },
    { name: 'Acessórios', value: 28 },
    { name: 'Smartwatches', value: 15 },
    { name: 'Outros', value: 15 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Cálculos de estatísticas de crescimento (simulado)
  const revenueGrowth = 12.4;
  const visitsGrowth = 8.7;
  const salesGrowth = 15.2;
  const ctrGrowth = -2.5;

  return (
    <SidebarLayout 
      user={demoUser} 
      stores={stores || []} 
      notifications={notifications || []}
      demoMode={true}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard - Modo Demonstração</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo ao ambiente de demonstração do CIP Shopee com dados simulados.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => navigate('/demo/products')}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Produtos
            </Button>
            <Button variant="ghost" onClick={() => navigate('/demo/optimizations')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Otimizações
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="stores">Lojas ({stores?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
                  <div className={`rounded-full p-1 ${revenueGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {revenueGrowth >= 0 ? 
                      <ArrowUp className="h-4 w-4 text-green-600" /> : 
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 42.349,87</div>
                  <p className={`text-xs ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}% em relação ao mês anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visitantes</CardTitle>
                  <div className={`rounded-full p-1 ${visitsGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {visitsGrowth >= 0 ? 
                      <ArrowUp className="h-4 w-4 text-green-600" /> : 
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">14.582</div>
                  <p className={`text-xs ${visitsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {visitsGrowth >= 0 ? '+' : ''}{visitsGrowth}% em relação ao mês anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                  <div className={`rounded-full p-1 ${salesGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {salesGrowth >= 0 ? 
                      <ArrowUp className="h-4 w-4 text-green-600" /> : 
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">842</div>
                  <p className={`text-xs ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {salesGrowth >= 0 ? '+' : ''}{salesGrowth}% em relação ao mês anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CTR Médio</CardTitle>
                  <div className={`rounded-full p-1 ${ctrGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {ctrGrowth >= 0 ? 
                      <ArrowUp className="h-4 w-4 text-green-600" /> : 
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2%</div>
                  <p className={`text-xs ${ctrGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ctrGrowth >= 0 ? '+' : ''}{ctrGrowth}% em relação ao mês anterior
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Faturamento (7 dias)</CardTitle>
                  <CardDescription>Faturamento diário em R$</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="valor" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Categorias</CardTitle>
                  <CardDescription>Distribuição de produtos por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="stores" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingStores ? (
                <p>Carregando lojas...</p>
              ) : stores && stores.length > 0 ? (
                stores.map((store) => (
                  <Card key={store.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/10 pb-2">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-md overflow-hidden">
                          <img 
                            src={store.shopLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.shopName)}&background=random`} 
                            alt={store.shopName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-base">{store.shopName}</CardTitle>
                          <CardDescription>ID: {store.shopId}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Produtos</p>
                          <p className="font-medium">{store.totalProducts}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pedidos</p>
                          <p className="font-medium">{store.totalOrders}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Faturamento Mensal</p>
                          <p className="font-medium">R$ {store.monthlyRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">{store.isActive ? 'Ativo' : 'Inativo'}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => navigate(`/demo/stores/${store.id}`)}
                        >
                          <Store className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p>Nenhuma loja encontrada.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}