
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import ScoreGauge from "@/components/dashboard/ScoreGauge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  RefreshCw,
  Clock,
  Award,
  BarChart3
} from "lucide-react";

interface StoreDiagnosis {
  id: number;
  overallScore: number;
  categoryScores: {
    ctr: number;
    inventory: number;
    sales: number;
    optimization: number;
    engagement: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: Array<{
    id: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionSteps: string[];
    expectedImpact: string;
    estimatedTime: string;
  }>;
  benchmarkData: {
    industryAverage: any;
    topPerformers: any;
    yourPosition: {
      percentile: number;
      rank: string;
    };
  };
  createdAt: string;
}

export default function Diagnosis() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());

  // Fetch latest diagnosis
  const { data: diagnosisData, isLoading: isLoadingDiagnosis } = useQuery({
    queryKey: ['/api/diagnosis/stores', storeId, 'latest'],
    queryFn: async () => {
      const response = await fetch(`/api/diagnosis/stores/${storeId}/latest`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch diagnosis');
      return response.json();
    },
    enabled: !!storeId
  });

  // Generate new diagnosis mutation
  const generateDiagnosis = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/diagnosis/stores/${storeId}/generate`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to generate diagnosis');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagnosis/stores', storeId, 'latest'] });
    }
  });

  const diagnosis: StoreDiagnosis | null = diagnosisData?.diagnosis;

  const toggleRecommendation = (id: string) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecommendations(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRankDisplay = (rank: string) => {
    const displays = {
      excellent: { label: 'Excelente', color: 'text-green-600', icon: Award },
      good: { label: 'Bom', color: 'text-blue-600', icon: TrendingUp },
      average: { label: 'Médio', color: 'text-yellow-600', icon: BarChart3 },
      below_average: { label: 'Abaixo da Média', color: 'text-orange-600', icon: TrendingDown },
      poor: { label: 'Fraco', color: 'text-red-600', icon: AlertTriangle }
    };
    return displays[rank as keyof typeof displays] || displays.average;
  };

  if (isLoadingDiagnosis) {
    return (
      <SidebarLayout title="Diagnóstico da Loja">
        <Helmet>
          <title>Diagnóstico da Loja | CIP Shopee</title>
        </Helmet>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Diagnóstico da Loja">
      <Helmet>
        <title>Diagnóstico da Loja | CIP Shopee</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Diagnóstico Completo</h1>
            <p className="text-muted-foreground">
              Análise abrangente da performance da sua loja
            </p>
          </div>
          <Button 
            onClick={() => generateDiagnosis.mutate()}
            disabled={generateDiagnosis.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${generateDiagnosis.isPending ? 'animate-spin' : ''}`} />
            {generateDiagnosis.isPending ? 'Gerando...' : 'Novo Diagnóstico'}
          </Button>
        </div>

        {!diagnosis ? (
          // No diagnosis available
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum diagnóstico encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Gere seu primeiro diagnóstico para obter insights detalhados sobre sua loja
              </p>
              <Button 
                onClick={() => generateDiagnosis.mutate()}
                disabled={generateDiagnosis.isPending}
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Gerar Diagnóstico
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Overall Score */}
              <div className="md:col-span-2">
                <ScoreGauge
                  score={diagnosis.overallScore}
                  title="Score Geral"
                  description="Performance global da loja"
                  benchmark={6.5}
                  size="lg"
                />
              </div>

              {/* Category Scores */}
              <ScoreGauge
                score={diagnosis.categoryScores.ctr}
                title="CTR"
                description="Taxa de cliques"
                benchmark={2.5}
              />
              <ScoreGauge
                score={diagnosis.categoryScores.inventory}
                title="Estoque"
                description="Gestão de inventário"
                benchmark={7.0}
              />
              <ScoreGauge
                score={diagnosis.categoryScores.sales}
                title="Vendas"
                description="Performance de vendas"
                benchmark={6.0}
              />
              <ScoreGauge
                score={diagnosis.categoryScores.optimization}
                title="Otimização"
                description="Produtos otimizados"
                benchmark={4.0}
              />
            </div>

            {/* Position & Benchmark */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Posição no Mercado
                </CardTitle>
                <CardDescription>
                  Como sua loja se compara com a concorrência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const rankDisplay = getRankDisplay(diagnosis.benchmarkData.yourPosition.rank);
                      const Icon = rankDisplay.icon;
                      return (
                        <>
                          <Icon className={`h-6 w-6 ${rankDisplay.color}`} />
                          <div>
                            <div className="font-semibold">{rankDisplay.label}</div>
                            <div className="text-sm text-muted-foreground">
                              Percentil {diagnosis.benchmarkData.yourPosition.percentile}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Score Geral</div>
                    <div className="text-2xl font-bold">{diagnosis.overallScore.toFixed(1)}/10</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Pontos Fortes
                  </CardTitle>
                  <CardDescription>
                    O que sua loja está fazendo bem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosis.strengths.length > 0 ? (
                    <div className="space-y-2">
                      {diagnosis.strengths.map((strength, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Nenhum ponto forte identificado. Continue otimizando para melhorar.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    Pontos de Melhoria
                  </CardTitle>
                  <CardDescription>
                    Áreas que precisam de atenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosis.weaknesses.length > 0 ? (
                    <div className="space-y-2">
                      {diagnosis.weaknesses.map((weakness, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{weakness}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Parabéns! Nenhum ponto crítico de melhoria identificado.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tactical Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recomendações Táticas
                </CardTitle>
                <CardDescription>
                  Ações específicas para melhorar sua performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {diagnosis.recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {diagnosis.recommendations.map((rec) => (
                      <div key={rec.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {rec.estimatedTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {rec.category}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRecommendation(rec.id)}
                          >
                            {expandedRecommendations.has(rec.id) ? 'Menos' : 'Mais'}
                          </Button>
                        </div>

                        {expandedRecommendations.has(rec.id) && (
                          <div className="space-y-3 pt-3 border-t">
                            <div>
                              <h5 className="font-medium text-sm mb-2">Passos de Ação:</h5>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                {rec.actionSteps.map((step, index) => (
                                  <li key={index}>{step}</li>
                                ))}
                              </ol>
                            </div>
                            <div>
                              <h5 className="font-medium text-sm mb-1">Impacto Esperado:</h5>
                              <p className="text-sm text-muted-foreground">{rec.expectedImpact}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma recomendação específica no momento. Sua loja está bem otimizada!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Diagnosis Info */}
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Diagnóstico gerado em {new Date(diagnosis.createdAt).toLocaleString('pt-BR')}. 
                Recomendamos gerar um novo diagnóstico a cada 7 dias para acompanhar sua evolução.
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
