
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreGaugeProps {
  score: number;
  title: string;
  description?: string;
  benchmark?: number;
  showTrend?: boolean;
  trend?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreGauge({ 
  score, 
  title, 
  description, 
  benchmark, 
  showTrend = false, 
  trend,
  size = 'md' 
}: ScoreGaugeProps) {
  
  // Calcular cor baseada no score
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-blue-100';
    if (score >= 4) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excelente';
    if (score >= 6) return 'Bom';
    if (score >= 4) return 'Regular';
    return 'Precisa Melhorar';
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return Minus;
    return trend > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (trend?: number) => {
    if (!trend) return 'text-gray-500';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  // Tamanhos baseados na prop size
  const sizes = {
    sm: { gauge: 60, stroke: 6, text: 'text-lg', card: 'h-32' },
    md: { gauge: 80, stroke: 8, text: 'text-xl', card: 'h-40' },
    lg: { gauge: 120, stroke: 12, text: 'text-3xl', card: 'h-56' }
  };

  const { gauge, stroke, text, card } = sizes[size];
  
  // Calcular ângulo do arco (0-180 graus)
  const angle = (score / 10) * 180;
  const radius = (gauge - stroke) / 2;
  const circumference = Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (angle / 180) * circumference;

  return (
    <Card className={`${card} flex flex-col`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {showTrend && trend !== undefined && (
            <div className={`flex items-center text-xs ${getTrendColor(trend)}`}>
              {(() => {
                const Icon = getTrendIcon(trend);
                return <Icon className="h-3 w-3 mr-1" />;
              })()}
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </div>
          )}
        </div>
        {description && (
          <CardDescription className="text-xs">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Gauge SVG */}
          <svg width={gauge} height={gauge / 2 + 20} className="transform -rotate-180">
            {/* Background arc */}
            <path
              d={`M ${stroke/2} ${gauge/2} A ${radius} ${radius} 0 0 1 ${gauge - stroke/2} ${gauge/2}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            
            {/* Score arc */}
            <path
              d={`M ${stroke/2} ${gauge/2} A ${radius} ${radius} 0 0 1 ${gauge - stroke/2} ${gauge/2}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={getScoreColor(score)}
              style={{
                transition: 'stroke-dashoffset 1s ease-in-out'
              }}
            />
          </svg>
          
          {/* Score text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className={`font-bold ${text} ${getScoreColor(score)}`}>
              {score.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">/ 10</div>
            <Badge 
              variant="secondary" 
              className={`text-xs mt-1 ${getScoreBackground(score)} ${getScoreColor(score)} border-0`}
            >
              {getScoreLabel(score)}
            </Badge>
          </div>
        </div>
      </CardContent>
      
      {/* Benchmark comparison */}
      {benchmark && (
        <div className="px-4 pb-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Você</span>
            <span>Benchmark: {benchmark.toFixed(1)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div 
              className={`h-1 rounded-full ${getScoreColor(score)} bg-current`}
              style={{ width: `${Math.min((score / 10) * 100, 100)}%` }}
            ></div>
            {/* Benchmark marker */}
            <div 
              className="relative -mt-1"
              style={{ marginLeft: `${Math.min((benchmark / 10) * 100, 100)}%` }}
            >
              <div className="absolute w-0.5 h-2 bg-gray-600 -ml-0.25"></div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
