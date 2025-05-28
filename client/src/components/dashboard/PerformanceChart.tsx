import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage } from "@/lib/utils/formatters";

interface PerformanceChartProps {
  metrics: any;
  isLoading: boolean;
}

export default function PerformanceChart({ metrics, isLoading }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!metrics?.dailyStats) {
      // Dados de exemplo para quando não há dados reais
      return Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        sales: Math.random() * 1000 + 500,
        views: Math.random() * 100 + 50,
        ctr: Math.random() * 5 + 1,
        conversions: Math.random() * 10 + 5
      }));
    }

    return metrics.dailyStats.map((day: any) => ({
      date: new Date(day.date).toLocaleDateString('pt-BR', { 
        month: 'short', 
        day: 'numeric' 
      }),
      sales: day.sales || 0,
      views: day.views || 0,
      ctr: day.ctr || 0,
      conversions: day.conversions || 0
    }));
  }, [metrics]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center text-sm mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="mr-2">{entry.name}:</span>
              <span className="font-medium">
                {entry.dataKey === 'sales' 
                  ? formatCurrency(entry.value)
                  : entry.dataKey === 'ctr'
                  ? formatPercentage(entry.value)
                  : entry.value
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
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
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            name="Vendas"
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="views" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            name="Visualizações"
            dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="ctr" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            name="CTR (%)"
            dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}