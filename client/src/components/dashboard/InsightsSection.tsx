
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, CheckCircle, Lightbulb, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InsightsSectionProps {
  storeId: number;
}

export default function InsightsSection({ storeId }: InsightsSectionProps) {
  const queryClient = useQueryClient();

  // Fetch insights
  const { data: insights, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/shopee/stores/${storeId}/insights`],
    enabled: !!storeId,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Process insights mutation
  const processInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/shopee/stores/${storeId}/insights/process`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to process insights');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Insights processados",
        description: "Novos insights foram adicionados às suas notificações",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao processar insights",
        description: error?.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'low_ctr':
      case 'trend_alert':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'high_performance':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'optimization_opportunity':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights da IA</CardTitle>
          <CardDescription>Analisando sua loja...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Erro nos Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os insights da sua loja.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  const allInsights = [
    ...insights.productInsights || [],
    ...insights.storeInsights || []
  ];

  const topInsights = allInsights.slice(0, 3); // Mostrar apenas os 3 principais

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Insights da IA
          </CardTitle>
          <CardDescription>
            Análises automáticas da sua loja
            {insights.summary && (
              <span className="ml-2">
                • {insights.summary.totalInsights} insights encontrados
                {insights.summary.highPriority > 0 && (
                  <span className="text-orange-600 dark:text-orange-400">
                    • {insights.summary.highPriority} alta prioridade
                  </span>
                )}
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => processInsightsMutation.mutate()}
            disabled={processInsightsMutation.isPending}
          >
            {processInsightsMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Processando...
              </>
            ) : (
              'Criar Alertas'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {topInsights.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">Tudo funcionando perfeitamente!</p>
            <p className="text-muted-foreground">Sua loja está com boa performance.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className="mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {insight.message}
                    </p>
                    {'severity' in insight && (
                      <Badge 
                        variant={getSeverityColor(insight.severity)}
                        className="ml-2 text-xs"
                      >
                        {insight.severity === 'high' ? 'Alta' : 
                         insight.severity === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    )}
                  </div>
                  {insight.actionSuggestion && (
                    <p className="text-xs text-muted-foreground">
                      💡 {insight.actionSuggestion}
                    </p>
                  )}
                  {'metrics' in insight && insight.metrics && (
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {insight.metrics.currentCtr && (
                        <span>CTR: {insight.metrics.currentCtr.toFixed(2)}%</span>
                      )}
                      {insight.metrics.potentialImprovement && (
                        <span className="text-green-600 dark:text-green-400">
                          Potencial: +{insight.metrics.potentialImprovement.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {allInsights.length > 3 && (
              <div className="pt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  E mais {allInsights.length - 3} insights disponíveis...
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
