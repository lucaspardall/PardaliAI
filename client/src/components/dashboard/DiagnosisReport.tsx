
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import type { StoreDiagnosis } from '@/lib/types';

interface DiagnosisReportProps {
  diagnosis: StoreDiagnosis;
}

export default function DiagnosisReport({ diagnosis }: DiagnosisReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8) return 'success' as const;
    if (score >= 6) return 'warning' as const;
    return 'destructive' as const;
  };

  return (
    <div className="space-y-6">
      {/* Score Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Score Geral da Loja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(diagnosis.overallScore)}`}>
              {diagnosis.overallScore.toFixed(1)}/10
            </div>
            <Badge variant={getScoreBadgeVariant(diagnosis.overallScore)} className="mt-2">
              {diagnosis.overallScore >= 8 ? 'Excelente' : 
               diagnosis.overallScore >= 6 ? 'Bom' : 
               diagnosis.overallScore >= 4 ? 'Regular' : 'Precisa Melhorar'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Scores por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(diagnosis.categoryScores).map(([category, score]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="capitalize">{category.replace('_', ' ')}</span>
                  <span className={`font-semibold ${getScoreColor(score)}`}>
                    {score.toFixed(1)}/10
                  </span>
                </div>
                <Progress value={score * 10} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pontos Fortes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <TrendingUp className="h-5 w-5" />
            Pontos Fortes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {diagnosis.strengths.map((strength, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pontos Fracos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <TrendingDown className="h-5 w-5" />
            Áreas para Melhoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {diagnosis.weaknesses.map((weakness, index) => (
              <div key={index} className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>{weakness}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações Táticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {diagnosis.recommendations.map((rec, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{rec.priority}</Badge>
                  <span className="font-medium">{rec.category}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                <p className="text-sm font-medium">Impacto esperado: {rec.expectedImpact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
