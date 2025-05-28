
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { TrendingUp, TrendingDown, Eye, ShoppingCart, Target, BarChart3, DollarSign } from "lucide-react";

interface ReportData {
  totalSales: number;
  averageCtr: number;
  totalConversions: number;
  totalOptimizations: number;
  salesGrowth: number;
  ctrGrowth: number;
  conversionGrowth: number;
  optimizationGrowth: number;
}

export default function Reports() {
  const [dateRange, setDateRange] = useState<string>('30d');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['/api/reports', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/reports?period=${dateRange}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json() as ReportData;
    }
  });

  const topProducts = [
    { name: "Smartphone Galaxy A54", sales: 12500, ctr: 4.2, optimizations: 3 },
    { name: "Notebook Gamer RTX", sales: 8900, ctr: 3.8, optimizations: 2 },
    { name: "Fone Bluetooth Premium", sales: 4800, ctr: 3.5, optimizations: 1 },
    { name: "Smartwatch Fitness Pro", sales: 3200, ctr: 3.1, optimizations: 2 },
    { name: "Câmera Action 4K", sales: 2800, ctr: 2.9, optimizations: 1 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <SidebarLayout title="Relatórios">
        <Helmet>
          <title>Relatórios | CIP Shopee</title>
        </Helmet>
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Relatórios">
      <Helmet>
        <title>Relatórios | CIP Shopee</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Relatórios</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Análise completa de performance e otimizações
            </p>
          </div>
          
          {/* Date Range Buttons */}
          <div className="flex flex-wrap gap-2">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vendas Totais */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vendas Totais
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-xl md:text-2xl font-bold">
                  {formatCurrency(reportData?.totalSales || 26300)}
                </div>
                <div className={`flex items-center text-xs ${getGrowthColor(reportData?.salesGrowth || 12.5)}`}>
                  {(() => {
                    const Icon = getGrowthIcon(reportData?.salesGrowth || 12.5);
                    return <Icon className="h-3 w-3 mr-1" />;
                  })()}
                  {formatPercentage(reportData?.salesGrowth || 12.5)} vs período anterior
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTR Médio */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  CTR Médio
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-xl md:text-2xl font-bold">
                  {(reportData?.averageCtr || 3.7).toFixed(1)}%
                </div>
                <div className={`flex items-center text-xs ${getGrowthColor(reportData?.ctrGrowth || 0.8)}`}>
                  {(() => {
                    const Icon = getGrowthIcon(reportData?.ctrGrowth || 0.8);
                    return <Icon className="h-3 w-3 mr-1" />;
                  })()}
                  {formatPercentage(reportData?.ctrGrowth || 0.8)} vs período anterior
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversões */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversões
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-xl md:text-2xl font-bold">
                  {(reportData?.totalConversions || 838).toLocaleString()}
                </div>
                <div className={`flex items-center text-xs ${getGrowthColor(reportData?.conversionGrowth || 15.2)}`}>
                  {(() => {
                    const Icon = getGrowthIcon(reportData?.conversionGrowth || 15.2);
                    return <Icon className="h-3 w-3 mr-1" />;
                  })()}
                  {formatPercentage(reportData?.conversionGrowth || 15.2)} vs período anterior
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Otimizações */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Otimizações
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-xl md:text-2xl font-bold">
                  {reportData?.totalOptimizations || 80}
                </div>
                <div className="text-xs text-blue-600">
                  45 aplicadas este mês
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Top Produtos</CardTitle>
            <CardDescription>
              Produtos com melhor performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs md:text-sm font-medium">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm md:text-base truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {product.optimizations} otimização{product.optimizations !== 1 ? 'ões' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm md:text-base font-medium">
                      {formatCurrency(product.sales)}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      CTR: {product.ctr}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
