
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RefreshCw, TrendingUp, Calendar } from 'lucide-react';

export default function DemoReports() {
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
          <h2 className="text-xl font-semibold mb-2">Carregando relatórios...</h2>
          <p className="text-muted-foreground">Preparando dados simulados de relatórios</p>
        </div>
      </div>
    );
  }

  // Dados de exemplo para os gráficos
  const salesData = [
    { name: '01/01', vendas: 120, receita: 9800 },
    { name: '02/01', vendas: 145, receita: 12500 },
    { name: '03/01', vendas: 132, receita: 10900 },
    { name: '04/01', vendas: 167, receita: 14200 },
    { name: '05/01', vendas: 178, receita: 15300 },
    { name: '06/01', vendas: 149, receita: 12800 },
    { name: '07/01', vendas: 130, receita: 10600 },
  ];

  const conversionData = [
    { name: '01/01', taxa: 3.2 },
    { name: '02/01', taxa: 3.5 },
    { name: '03/01', taxa: 3.3 },
    { name: '04/01', taxa: 3.8 },
    { name: '05/01', taxa: 4.1 },
    { name: '06/01', taxa: 3.9 },
    { name: '07/01', taxa: 3.6 },
  ];

  const trafficData = [
    { name: '01/01', visitas: 1850 },
    { name: '02/01', visitas: 2100 },
    { name: '03/01', visitas: 1950 },
    { name: '04/01', visitas: 2350 },
    { name: '05/01', visitas: 2500 },
    { name: '06/01', visitas: 2250 },
    { name: '07/01', visitas: 2000 },
  ];

  return (
    <SidebarLayout 
      user={demoUser} 
      stores={[]} 
      notifications={[]}
      demoMode={true}
      title="Relatórios"
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground mt-1">
              Visualize estatísticas e métricas de desempenho da sua loja
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/demo/dashboard')}>
              <Calendar className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="conversions">Conversões</TabsTrigger>
            <TabsTrigger value="traffic">Tráfego</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,021</div>
                  <p className="text-xs text-green-600">+15.2% em relação ao mês anterior</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 86,100.50</div>
                  <p className="text-xs text-green-600">+12.4% em relação ao mês anterior</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 84.33</div>
                  <p className="text-xs text-red-600">-2.1% em relação ao mês anterior</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Vendas</CardTitle>
                <CardDescription>Dados dos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="vendas" fill="#8884d8" name="Vendas" />
                      <Bar yAxisId="right" dataKey="receita" fill="#82ca9d" name="Receita (R$)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="conversions" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.67%</div>
                  <p className="text-xs text-green-600">+0.3% em relação ao mês anterior</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Abandono de Carrinho</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24.8%</div>
                  <p className="text-xs text-green-600">-2.1% em relação ao mês anterior</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">CTR Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2%</div>
                  <p className="text-xs text-red-600">-0.4% em relação ao mês anterior</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conversão</CardTitle>
                <CardDescription>Dados dos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={conversionData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[2.5, 4.5]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="taxa" stroke="#8884d8" activeDot={{ r: 8 }} name="Taxa de Conversão (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="traffic" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Visitas Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">14,582</div>
                  <p className="text-xs text-green-600">+8.7% em relação ao mês anterior</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">9,247</div>
                  <p className="text-xs text-green-600">+5.4% em relação ao mês anterior</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4m 12s</div>
                  <p className="text-xs text-green-600">+0.8% em relação ao mês anterior</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Tráfego da Loja</CardTitle>
                <CardDescription>Dados dos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trafficData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="visitas" stroke="#82ca9d" name="Visitas" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
