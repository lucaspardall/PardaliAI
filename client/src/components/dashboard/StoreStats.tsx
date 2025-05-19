import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCTR, formatNumber, formatCurrency, formatChange } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";

interface StoreStatsProps {
  activeStore: number | null;
  storeMetrics: any;
  isLoading: boolean;
}

export default function StoreStats({ activeStore, storeMetrics, isLoading }: StoreStatsProps) {
  // Get the most recent metrics
  const latestMetrics = storeMetrics && storeMetrics.length > 0 ? storeMetrics[storeMetrics.length - 1] : null;
  const previousMetrics = storeMetrics && storeMetrics.length > 1 ? storeMetrics[storeMetrics.length - 2] : null;
  
  // Calculate changes
  const calculateChange = (current: number | undefined, previous: number | undefined) => {
    if (!current || !previous) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  const ctrChange = calculateChange(latestMetrics?.averageCtr, previousMetrics?.averageCtr);
  const viewsChange = calculateChange(latestMetrics?.totalViews, previousMetrics?.totalViews);
  const salesChange = calculateChange(latestMetrics?.totalSales, previousMetrics?.totalSales);
  const revenueChange = calculateChange(latestMetrics?.totalRevenue, previousMetrics?.totalRevenue);

  const stats = [
    {
      title: "CTR Médio",
      value: latestMetrics?.averageCtr ? formatCTR(latestMetrics.averageCtr) : "-",
      change: ctrChange,
      comparison: "vs. semana passada",
      icon: "ri-percentage-line"
    },
    {
      title: "Total de Produtos",
      value: latestMetrics?.productCount ? formatNumber(latestMetrics.productCount) : "-",
      icon: "ri-shopping-bag-3-line"
    },
    {
      title: "Vendas (7 dias)",
      value: latestMetrics?.totalSales ? formatNumber(latestMetrics.totalSales) : "-",
      change: salesChange,
      comparison: "vs. semana passada",
      icon: "ri-shopping-cart-line"
    },
    {
      title: "Visualizações",
      value: latestMetrics?.totalViews ? formatNumber(latestMetrics.totalViews) : "-",
      change: viewsChange,
      comparison: "vs. semana passada",
      icon: "ri-eye-line"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {isLoading ? (
        // Loading skeletons
        Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-36" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        // Actual stats
        stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                {stat.change !== undefined && (
                  <Badge variant={stat.change >= 0 ? "success" : "destructive"} className="px-1.5 py-0.5 text-xs">
                    <i className={stat.change >= 0 ? "ri-arrow-up-s-line mr-1" : "ri-arrow-down-s-line mr-1"}></i>
                    {Math.abs(stat.change).toFixed(1)}%
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-semibold">{stat.value}</p>
              {stat.comparison && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span>{stat.comparison}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
