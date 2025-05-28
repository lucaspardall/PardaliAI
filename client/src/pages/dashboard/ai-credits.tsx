import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatDate } from "@/lib/utils/formatters";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet-async";
import { CreditCard, TrendingUp, Zap, Clock, Package } from "lucide-react";
import { Link } from "wouter";

export default function AiCredits() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30');

  // Fetch AI credits history
  const { data: creditsHistory, isLoading: historyLoading } = useQuery({
    queryKey: [`/api/ai-credits/history?days=${period}`],
    queryFn: () => apiRequest('GET', `/api/ai-credits/history?days=${period}`).then(res => res.json()),
    retry: 2,
  });

  // Fetch AI credits stats
  const { data: creditsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/ai-credits/stats'],
    queryFn: () => apiRequest('GET', '/api/ai-credits/stats').then(res => res.json()),
    retry: 2,
  });

  // Generate chart data
  const chartData = creditsHistory?.dailyUsage || Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { 
      month: 'short', 
      day: 'numeric' 
    }),
    remaining: Math.max(0, 100 - i * 5),
    used: Math.min(100, i * 5),
    gained: i % 3 === 0 ? 10 : 0
  }));

  const planInfo = {
    free: { name: 'Gratuito', credits: 10, color: 'bg-gray-500' },
    starter: { name: 'Starter', credits: 100, color: 'bg-blue-500' },
    pro: { name: 'Pro', credits: 500, color: 'bg-purple-500' },
    enterprise: { name: 'Enterprise', credits: -1, color: 'bg-orange-500' }
  };

  const currentPlan = planInfo[user?.plan as keyof typeof planInfo] || planInfo.free;
  const creditsUsed = (currentPlan.credits === -1) ? 0 : Math.max(0, currentPlan.credits - (user?.aiCreditsLeft || 0));
  const usagePercentage = (currentPlan.credits === -1) ? 0 : (creditsUsed / currentPlan.credits) * 100;

  if (historyLoading || statsLoading) {
    return (
      <SidebarLayout title="Créditos de IA">
        <Helmet>
          <title>Créditos de IA | CIP Shopee</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Créditos de IA">
      <Helmet>
        <title>Créditos de IA | CIP Shopee</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Créditos de IA</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus créditos e veja o histórico de uso
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Período:</span>
            <div className="flex gap-1">
              {[
                { value: '7', label: '7d' },
                { value: '30', label: '30d' },
                { value: '90', label: '90d' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={period === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Plano Atual: {currentPlan.name}
                </CardTitle>
                <CardDescription>
                  {currentPlan.credits === -1 
                    ? 'Créditos ilimitados'
                    : `${user?.aiCreditsLeft || 0} de ${currentPlan.credits} créditos restantes`
                  }
                </CardDescription>
              </div>
              <Badge className={`${currentPlan.color} text-white`}>
                {currentPlan.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {currentPlan.credits !== -1 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uso atual</span>
                  <span>{creditsUsed} / {currentPlan.credits}</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
            )}

            {user?.plan === 'free' && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 mb-2">
                  Precisa de mais créditos? Faça upgrade do seu plano!
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard/subscription">
                    Fazer Upgrade
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Usados (30d)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditsStats?.used30Days || creditsUsed}</div>
              <p className="text-xs text-muted-foreground">
                nos últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Otimizações Realizadas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditsStats?.optimizationsCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                total de produtos otimizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditsStats?.dailyAverage || '0.0'}</div>
              <p className="text-xs text-muted-foreground">
                créditos por dia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Uso</CardTitle>
            <CardDescription>Acompanhe seu consumo de créditos ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <Tooltip />
                  <Line type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" strokeWidth={2} name="Restantes" />
                  <Line type="monotone" dataKey="used" stroke="#ef4444" strokeWidth={2} name="Usados" />
                  <Line type="monotone" dataKey="gained" stroke="#22c55e" strokeWidth={2} name="Recebidos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Credits History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Detalhado</CardTitle>
            <CardDescription>Todas as transações de créditos recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {creditsHistory?.transactions?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Créditos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditsHistory.transactions.map((transaction: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'used' ? 'destructive' : 'default'}>
                          {transaction.type === 'used' ? 'Usado' : 'Recebido'}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-right">
                        <span className={transaction.type === 'used' ? 'text-red-600' : 'text-green-600'}>
                          {transaction.type === 'used' ? '-' : '+'}{transaction.amount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma transação encontrada no período selecionado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}