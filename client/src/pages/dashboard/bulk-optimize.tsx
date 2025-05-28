import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/lib/types';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Helmet } from 'react-helmet-async';

interface BulkOptimizationProgress {
  productId: number;
  productName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export default function BulkOptimizePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState<BulkOptimizationProgress[]>([]);
  const [filter, setFilter] = useState<'all' | 'low_ctr' | 'no_optimization'>('low_ctr');

  // Buscar produtos
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products', filter],
    queryFn: () => apiRequest('GET', `/api/products?bulk_filter=${filter}`).then(res => res.json()),
  });

  // Mutation para otimização em lote
  const bulkOptimizeMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const response = await apiRequest('POST', '/api/products/bulk-optimize', {
        body: JSON.stringify({ productIds }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/optimizations'] });
      setSelectedProducts([]);
    }
  });

  const handleSelectProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && products) {
      setSelectedProducts(products.map((p: Product) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const startBulkOptimization = async () => {
    if (selectedProducts.length === 0) return;

    setIsOptimizing(true);

    // Inicializar progresso
    const initialProgress = selectedProducts.map(id => {
      const product = products?.find((p: Product) => p.id === id);
      return {
        productId: id,
        productName: product?.name || 'Produto',
        status: 'pending' as const
      };
    });

    setOptimizationProgress(initialProgress);

    try {
      // Processar produtos em lotes de 3 para não sobrecarregar
      const batchSize = 3;
      const batches = [];

      for (let i = 0; i < selectedProducts.length; i += batchSize) {
        batches.push(selectedProducts.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        // Atualizar status para "processing"
        setOptimizationProgress(prev => 
          prev.map(item => 
            batch.includes(item.productId) 
              ? { ...item, status: 'processing' }
              : item
          )
        );

        // Processar lote
        const promises = batch.map(async (productId) => {
          try {
            await apiRequest('POST', `/api/products/${productId}/optimize`);

            setOptimizationProgress(prev => 
              prev.map(item => 
                item.productId === productId 
                  ? { ...item, status: 'completed' }
                  : item
              )
            );
          } catch (error: any) {
            setOptimizationProgress(prev => 
              prev.map(item => 
                item.productId === productId 
                  ? { ...item, status: 'error', error: error.message }
                  : item
              )
            );
          }
        });

        await Promise.allSettled(promises);

        // Pequena pausa entre lotes
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/optimizations'] });

    } catch (error) {
      console.error('Erro na otimização em lote:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter((product: Product) => {
    switch (filter) {
      case 'low_ctr':
        return product.ctr !== null && product.ctr < 2.0;
      case 'no_optimization':
        return !product.lastOptimizationDate;
      default:
        return true;
    }
  }) : [];

  const selectedCount = selectedProducts.length;
  const estimatedCredits = user?.plan === 'free' ? selectedCount : 0;
  const canOptimize = user?.plan !== 'free' || (user?.aiCreditsLeft || 0) >= estimatedCredits;

  return (
    <SidebarLayout title="Otimização em Lote">
      <Helmet>
        <title>Otimização em Lote | CIP Shopee</title>
      </Helmet>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Otimização em Lote</h1>
            <p className="text-muted-foreground">
              Otimize múltiplos produtos de uma vez com nossa IA
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'low_ctr' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('low_ctr')}
            >
              CTR Baixo
            </Button>
            <Button
              variant={filter === 'no_optimization' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('no_optimization')}
            >
              Nunca Otimizados
            </Button>
          </div>
        </div>
      </div>

      {/* Status da Otimização */}
      {isOptimizing && optimizationProgress.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="ri-ai-generate animate-pulse mr-2"></i>
              Otimização em Andamento
            </CardTitle>
            <CardDescription>
              Processando {optimizationProgress.length} produto(s)...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optimizationProgress.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'error' ? 'bg-red-500' :
                      item.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                      'bg-gray-300'
                    }`}></div>
                    <span className="font-medium">{item.productName}</span>
                  </div>
                  <Badge variant={
                    item.status === 'completed' ? 'default' :
                    item.status === 'error' ? 'destructive' :
                    item.status === 'processing' ? 'secondary' :
                    'outline'
                  }>
                    {item.status === 'completed' ? 'Concluído' :
                     item.status === 'error' ? 'Erro' :
                     item.status === 'processing' ? 'Processando...' :
                     'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Progress 
                value={(optimizationProgress.filter(item => item.status === 'completed').length / optimizationProgress.length) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles de Seleção */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={selectedCount > 0 && selectedCount === filteredProducts.length}
                onCheckedChange={handleSelectAll}
                disabled={isOptimizing}
              />
              <span className="text-sm">
                {selectedCount} de {filteredProducts.length} produto(s) selecionado(s)
              </span>
            </div>

            <div className="flex items-center gap-4">
              {user?.plan === 'free' && (
                <div className="text-sm text-muted-foreground">
                  Créditos necessários: {estimatedCredits} | Disponíveis: {user?.aiCreditsLeft || 0}
                </div>
              )}

              <Button
                onClick={startBulkOptimization}
                disabled={selectedCount === 0 || isOptimizing || !canOptimize}
                className="min-w-[140px]"
              >
                {isOptimizing ? (
                  <>
                    <i className="ri-loader-2-line animate-spin mr-2"></i>
                    Otimizando...
                  </>
                ) : (
                  <>
                    <i className="ri-ai-generate mr-2"></i>
                    Otimizar {selectedCount} produto(s)
                  </>
                )}
              </Button>
            </div>
          </div>

          {!canOptimize && user?.plan === 'free' && (
            <Alert className="mt-4">
              <i className="ri-information-line"></i>
              <AlertDescription>
                Você não tem créditos suficientes para esta otimização. 
                <Button variant="link" className="p-0 h-auto ml-1" asChild>
                  <a href="/dashboard/subscription">Faça upgrade do seu plano</a>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Disponíveis</CardTitle>
          <CardDescription>
            {filter === 'low_ctr' && 'Produtos com CTR abaixo de 2% que precisam de otimização'}
            {filter === 'no_optimization' && 'Produtos que nunca foram otimizados'}
            {filter === 'all' && 'Todos os produtos da sua loja'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <i className="ri-search-line text-4xl text-muted-foreground mb-3"></i>
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                {filter === 'low_ctr' && 'Todos os seus produtos já têm boa performance!'}
                {filter === 'no_optimization' && 'Todos os seus produtos já foram otimizados!'}
                {filter === 'all' && 'Conecte uma loja para começar a otimizar produtos.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product: Product) => (
                <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                    disabled={isOptimizing}
                  />

                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{product.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>CTR: {product.ctr ? `${product.ctr.toFixed(2)}%` : 'N/A'}</span>
                      <span>Vendas: {formatCurrency(product.sales || 0)}</span>
                      {product.lastOptimizationDate && (
                        <span>Última otimização: {formatDate(product.lastOptimizationDate)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {product.ctr !== null && product.ctr < 1.5 && (
                      <Badge variant="destructive" className="text-xs">CTR Crítico</Badge>
                    )}
                    {product.ctr !== null && product.ctr >= 1.5 && product.ctr < 2.5 && (
                      <Badge variant="secondary" className="text-xs">Pode melhorar</Badge>
                    )}
                    {product.ctr !== null && product.ctr >= 3.0 && (
                      <Badge variant="default" className="text-xs">Boa performance</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}