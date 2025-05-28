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
import SidebarLayout from '@/components/layout/SidebarLayout';

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
    <SidebarLayout title="Otimizações">
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="text-xs md:text-sm"
              >
                Todas
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className="text-xs md:text-sm"
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === 'applied' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('applied')}
                className="text-xs md:text-sm"
              >
                Aplicadas
              </Button>
              <Button
                variant={statusFilter === 'ignored' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ignored')}
                className="text-xs md:text-sm"
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
        <Card className="text-center py-8 md:py-12">
            <CardContent className="px-4">
              <div className="mx-auto w-16 h-16 md:w-24 md:h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <i className="ri-search-line text-xl md:text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-base md:text-lg font-medium mb-2">Nenhuma otimização encontrada</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                Comece otimizando seus produtos para ver resultados aqui.
              </p>
              <Button onClick={() => window.location.href = '/dashboard/products'} size="sm" className="md:size-default">
                <i className="ri-shopping-bag-3-line mr-2"></i>
                Ver produtos
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
    </SidebarLayout>
  );
}