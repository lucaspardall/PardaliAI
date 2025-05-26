
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { formatDate } from '@/lib/utils/formatters';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30d');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['/api/reports', dateRange],
    queryFn: () => apiRequest('GET', `/api/reports?range=${dateRange}`),
  });

  const performanceData = [
    { date: '2024-01', sales: 4500, ctr: 3.2, conversions: 145 },
    { date: '2024-02', sales: 5200, ctr: 3.8, conversions: 168 },
    { date: '2024-03', sales: 4800, ctr: 3.5, conversions: 152 },
    { date: '2024-04', sales: 6100, ctr: 4.2, conversions: 195 },
    { date: '2024-05', sales: 5700, ctr: 3.9, conversions: 178 },
  ];

  const optimizationStats = [
    { name: 'Aplicadas', value: 45, color: '#10b981' },
    { name: 'Pendentes', value: 23, color: '#f59e0b' },
    { name: 'Ignoradas', value: 12, color: '#ef4444' },
  ];

  const topProducts = [
    { name: 'Produto A', sales: 1200, ctr: 4.5, optimizations: 3 },
    { name: 'Produto B', sales: 980, ctr: 3.8, optimizations: 2 },
    { name: 'Produto C', sales: 750, ctr: 3.2, optimizations: 1 },
    { name: 'Produto D', sales: 680, ctr: 2.9, optimizations: 2 },
    { name: 'Produto E', sales: 520, ctr: 2.5, optimizations: 1 },
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise completa de performance e otimizações
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('7d')}
            >
              7 dias
            </Button>
            <Button
              variant={dateRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('30d')}
            >
              30 dias
            </Button>
            <Button
              variant={dateRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('90d')}
            >
              90 dias
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <i className="ri-money-dollar-circle-line text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 26.300</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR Médio</CardTitle>
            <i className="ri-cursor-line text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.7%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.8%</span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <i className="ri-shopping-cart-line text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">838</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.2%</span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Otimizações</CardTitle>
            <i className="ri-ai-generate text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">80</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">45 aplicadas</span> este mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance ao Longo do Tempo</CardTitle>
            <CardDescription>
              Vendas e CTR nos últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="sales" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Vendas (R$)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="ctr" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="CTR (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Otimizações</CardTitle>
            <CardDescription>
              Distribuição das otimizações por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={optimizationStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {optimizationStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Produtos</CardTitle>
          <CardDescription>
            Produtos com melhor performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {product.optimizations} otimização{product.optimizations !== 1 ? 'ões' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">R$ {product.sales.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">CTR: {product.ctr}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
