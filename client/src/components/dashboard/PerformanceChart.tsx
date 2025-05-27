import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCTR, formatNumber } from "@/lib/utils/formatters";
import { ChartDataPoint } from "@/lib/types";

interface PerformanceChartProps {
  metrics: any[];
  isLoading: boolean;
}

export default function PerformanceChart({ metrics, isLoading }: PerformanceChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  
  useEffect(() => {
    if (metrics && metrics.length > 0) {
      try {
        // Process metrics into chart data format
        const data = metrics.map(metric => ({
          date: formatDate(metric.date),
          views: metric.totalViews || 0,
          sales: metric.totalSales || 0,
          ctr: metric.averageCtr || 0,
          revenue: metric.totalRevenue || 0
        }));
        
        setChartData(data);
      } catch (error) {
        console.error('Error processing chart data:', error);
        setChartData([]);
      }
    } else {
      setChartData([]);
    }
  }, [metrics]);
  
  // Custom tooltip for the chart
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
                {entry.name === 'CTR' 
                  ? formatCTR(entry.value) 
                  : formatNumber(entry.value)
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full h-64">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickMargin={10}
            />
            <YAxis 
              yAxisId="left" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickMargin={10}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="views"
              name="Visualizações"
              stroke="hsl(var(--chart-1))"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              name="Vendas"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ctr"
              name="CTR"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
        </div>
      )}
    </div>
  );
}
