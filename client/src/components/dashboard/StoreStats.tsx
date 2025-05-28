import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils/formatters";
import { TrendingUp, TrendingDown, Package, DollarSign, Eye, MousePointer } from "lucide-react";

interface StoreStatsProps {
  activeStore: number | null;
  storeMetrics: any;
  isLoading: boolean;
}

export default function StoreStats({ activeStore, storeMetrics, isLoading }: StoreStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!activeStore || !storeMetrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Nenhuma loja selecionada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: "Vendas Totais",
      value: formatCurrency(storeMetrics?.totalSales || 0),
      change: storeMetrics?.salesChange || 0,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Produtos Ativos", 
      value: formatNumber(storeMetrics?.activeProducts || 0),
      change: storeMetrics?.productsChange || 0,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Visualizações",
      value: formatNumber(storeMetrics?.totalViews || 0),
      change: storeMetrics?.viewsChange || 0,
      icon: Eye,
      color: "text-purple-600"
    },
    {
      title: "CTR Médio",
      value: formatPercentage(storeMetrics?.averageCtr || 0),
      change: storeMetrics?.ctrChange || 0,
      icon: MousePointer,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change >= 0;
        const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ChangeIcon className={`h-3 w-3 mr-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                  {isPositive ? '+' : ''}{stat.change.toFixed(1)}%
                </span>
                <span className="ml-1">vs período anterior</span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}