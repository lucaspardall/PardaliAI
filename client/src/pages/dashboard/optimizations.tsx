
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { formatDate } from '@/lib/utils/formatters';

interface Optimization {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  status: 'pending' | 'applied' | 'ignored';
  originalTitle?: string;
  suggestedTitle?: string;
  originalDesc?: string;
  suggestedDesc?: string;
  originalKeywords?: string;
  suggestedKeywords?: string;
  reasoningNotes?: string;
  createdAt: string;
  appliedAt?: string;
}

export default function OptimizationsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'applied' | 'ignored'>('all');

  const { data: optimizations, isLoading } = useQuery({
    queryKey: ['/api/optimizations'],
    queryFn: () => apiRequest('GET', '/api/optimizations').then(res => res.json()),
  });

  const filteredOptimizations = Array.isArray(optimizations) 
    ? optimizations.filter((opt: Optimization) => 
        statusFilter === 'all' || opt.status === statusFilter
      )
    : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return 'ri-check-line';
      case 'ignored': return 'ri-close-line';
      default: return 'ri-time-line';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'success';
      case 'ignored': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Otimizações</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as otimizações de produtos
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filtros</span>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === 'applied' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('applied')}
              >
                Aplicadas
              </Button>
              <Button
                variant={statusFilter === 'ignored' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ignored')}
              >
                Ignoradas
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOptimizations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <i className="ri-ai-generate text-4xl text-muted-foreground mb-3"></i>
            <h3 className="text-lg font-medium mb-2">
              {statusFilter === 'all' 
                ? 'Nenhuma otimização encontrada' 
                : `Nenhuma otimização ${statusFilter === 'pending' ? 'pendente' : statusFilter === 'applied' ? 'aplicada' : 'ignorada'} encontrada`}
            </h3>
            <p className="text-muted-foreground mb-4">
              Comece otimizando seus produtos para ver resultados aqui.
            </p>
            <Button asChild>
              <Link href="/dashboard/products">
                Ver produtos
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOptimizations.map((optimization: Optimization) => (
            <Card key={optimization.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {optimization.productImage && (
                    <img
                      src={optimization.productImage}
                      alt={optimization.productName}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium truncate">
                          {optimization.productName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Criada em {formatDate(optimization.createdAt)}
                          {optimization.appliedAt && (
                            <span> • Aplicada em {formatDate(optimization.appliedAt)}</span>
                          )}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(optimization.status) as any}>
                        <i className={`${getStatusIcon(optimization.status)} mr-1`}></i>
                        {optimization.status === 'applied' 
                          ? 'Aplicada' 
                          : optimization.status === 'ignored' 
                          ? 'Ignorada' 
                          : 'Pendente'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {optimization.suggestedTitle && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Título sugerido:</p>
                          <p className="text-sm line-clamp-2">{optimization.suggestedTitle}</p>
                        </div>
                      )}
                      
                      {optimization.reasoningNotes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Análise da IA:</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {optimization.reasoningNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/product/${optimization.productId}`}>
                          Ver produto
                        </Link>
                      </Button>
                      {optimization.status === 'pending' && (
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/optimize/${optimization.productId}`}>
                            Revisar otimização
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
