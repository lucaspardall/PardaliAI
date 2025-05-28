import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Helmet } from 'react-helmet-async';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface CreditHistoryItem {
  id: number;
  action: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  description: string;
  relatedEntityType?: string;
  createdAt: string;
}

interface UsageAnalytics {
  totalUsed: number;
  totalGained: number;
  netUsage: number;
  dailyUsage: Array<{ date: string; used: number; gained: number }>;
  actionBreakdown: Array<{ action: string; count: number; total: number }>;
  period: number;
}

export default function AiCreditsPage() {
  const { user } = useAuth();
  const [analyticsRange, setAnalyticsRange] = useState('30');

  // Buscar histórico de créditos
  const { data: creditHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/ai-credits/history'],
    queryFn: () => apiRequest('GET', '/api/ai-credits/history?limit=100').then(res => res.json()),
  });

  // Buscar analytics de uso
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/ai-credits/analytics', analyticsRange],
    queryFn: () => apiRequest('GET', `/api/ai-credits/analytics?days=${analyticsRange}`).then(res => res.json()),
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'used': return 'ri-subtract-line';
      case 'refunded': return 'ri-refund-line';
      case 'bonus': return 'ri-gift-line';
      case 'plan_upgrade': return 'ri-vip-crown-line';
      default: return 'ri-information-line';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'used': return 'destructive';
      case 'refunded': return 'secondary';
      case 'bonus': return 'default';
      case 'plan_upgrade': return 'default';
      default: return 'outline';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'used': return 'Utilizado';
      case 'refunded': return 'Reembolsado';
      case 'bonus': return 'Bônus';
      case 'plan_upgrade': return 'Upgrade do Plano';
      default: return action;
    }
  };

  const getUsagePercentage = () => {
    if (!user || user.plan !== 'free') return 100;
    const totalCredits = 10; // Plano free tem 10 créditos
    return Math.max(0, (user.aiCreditsLeft / totalCredits) * 100);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <SidebarLayout title="Créditos de IA">
      <Helmet>
        <title>Créditos de IA | CIP Shopee</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Créditos de IA</h1>
        <p className="text-muted-foreground">
          Monitore o uso dos seus créditos de inteligência artificial
        </p>
      </div>

      {/* Status Atual */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Disponíveis</CardTitle>
            <i className="ri-ai-generate text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.plan === 'free' 
                ? `${user?.aiCreditsLeft || 0}/10` 
                : 'Ilimitado'}
            </div>
            {user?.plan === 'free' && (
              <div className="mt-2">
                <Progress value={getUsagePercentage()} className="h-2" />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {user?.plan === 'free' 
                ? 'Plano gratuito'
                : `Plano ${user?.plan?.toUpperCase()}`}
            </p>
          </CardContent>
        </Card>

        {analytics && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usados ({analyticsRange}d)</CardTitle>
                <i className="ri-subtract-line text-muted-foreground"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.totalUsed}</div>
                <p className="text-xs text-muted-foreground">
                  Nos últimos {analyticsRange} dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recebidos ({analyticsRange}d)</CardTitle>
                <i className="ri-add-line text-muted-foreground"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.totalGained}</div>
                <p className="text-xs text-muted-foreground">
                  Bônus e recargas
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Visualize todas as suas transações de créditos de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-4">
                  {Array(10).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : !creditHistory || creditHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <i className="ri-history-line text-4xl text-muted-foreground mb-3"></i>
                  <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
                  <p className="text-muted-foreground">
                    Suas transações de créditos aparecerão aqui quando você usar a IA.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {creditHistory.map((item: CreditHistoryItem) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.amount < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          <i className={`${getActionIcon(item.action)} text-sm`}></i>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.description}</h4>
                            <Badge variant={getActionColor(item.action)} className="text-xs">
                              {getActionLabel(item.action)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{formatDate(item.createdAt)}</span>
                            {item.relatedEntityType && (
                              <span>Tipo: {item.relatedEntityType}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-medium ${
                          item.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.amount > 0 ? '+' : ''}{item.amount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Saldo: {item.newBalance}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Analytics de Uso</h3>
              <Select value={analyticsRange} onValueChange={setAnalyticsRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {analyticsLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : analytics ? (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Gráfico de uso diário */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Uso Diário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.dailyUsage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                        <YAxis />
                        <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')} />
                        <Line type="monotone" dataKey="used" stroke="#ef4444" strokeWidth={2} name="Usados" />
                        <Line type="monotone" dataKey="gained" stroke="#22c55e" strokeWidth={2} name="Recebidos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Breakdown por ação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribuição por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={analytics.actionBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total"
                          nameKey="action"
                          label={({ action, total }) => `${getActionLabel(action)}: ${total}`}
                        >
                          {analytics.actionBreakdown.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Resumo do período */}
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo do Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{analytics.totalUsed}</div>
                      <p className="text-sm text-muted-foreground">Total Usado</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics.totalGained}</div>
                      <p className="text-sm text-muted-foreground">Total Recebido</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${analytics.netUsage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {analytics.netUsage > 0 ? '+' : ''}{analytics.netUsage}
                      </div>
                      <p className="text-sm text-muted-foreground">Uso Líquido</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analytics.period}</div>
                      <p className="text-sm text-muted-foreground">Dias Analisados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade CTA para usuários free */}
      {user?.plan === 'free' && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Precisa de mais créditos?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Faça upgrade para ter créditos ilimitados e mais funcionalidades.
                </p>
              </div>
              <Button asChild>
                <a href="/dashboard/subscription">
                  <i className="ri-vip-crown-line mr-2"></i>
                  Fazer Upgrade
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </SidebarLayout>
  );
}