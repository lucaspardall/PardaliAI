import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import StoreStats from "@/components/dashboard/StoreStats";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import ProductList from "@/components/dashboard/ProductList";
import OptimizationItem from "@/components/dashboard/OptimizationItem";
import ConnectStore from "@/components/dashboard/ConnectStore";
import InsightsSection from "@/components/dashboard/InsightsSection";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Package, TrendingUp, Users, ShoppingCart, DollarSign, RefreshCw, Plus, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeStore, setActiveStore] = useState<number | null>(null);
  const [period, setPeriod] = useState<string>('7');
  const [location] = useLocation();

  const queryClient = useQueryClient();

  // Detectar se acabou de conectar uma loja Shopee
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopeeConnected = urlParams.get('shopeeConnected');
    const storeId = urlParams.get('storeId');

    if (shopeeConnected === 'true') {
      console.log('🎉 Shopee conectado com sucesso! Atualizando dados...');

      // Invalidar todas as queries relacionadas a stores
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shopee/status"] });

      // Se tivermos storeId, definir como loja ativa
      if (storeId) {
        setActiveStore(parseInt(storeId));
      }

      // Mostrar toast de sucesso
      toast({
        title: "🎉 Shopee conectado!",
        description: "Sua loja foi conectada com sucesso. Carregando dados...",
      });

      // Limpar parâmetros da URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [location, queryClient]);

  // Fetch user's stores
  const { 
    data: stores, 
    isLoading: storesLoading, 
    error: storesError 
  } = useQuery({
    queryKey: ["/api/stores"],
    queryFn: async () => {
      const response = await fetch('/api/stores', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stores');
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const syncStoreMutation = useMutation({
    mutationFn: async (storeId: number) => {
      const response = await fetch(`/api/stores/${storeId}/sync`, { 
        method: 'POST',
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Failed to sync store');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sincronização iniciada",
        description: "A sincronização da sua loja foi iniciada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message || "Erro ao sincronizar a loja.",
        variant: "destructive",
      });
    }
  });

  const handleSyncStore = (storeId: number) => {
    syncStoreMutation.mutate(storeId);
  };

  // Set active store when stores are loaded
  useEffect(() => {
    if (stores?.length > 0 && !activeStore) {
      setActiveStore(stores[0].id);
    }
  }, [stores, activeStore]);

  // Fetch store metrics if a store is selected
  const { data: storeMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: [activeStore ? `/api/stores/${activeStore}/metrics?days=${period}` : null],
    queryFn: async () => {
      if (!activeStore) return null;
      const response = await fetch(`/api/stores/${activeStore}/metrics?days=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    enabled: !!activeStore,
  });

  // Fetch products for active store
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: [activeStore ? `/api/stores/${activeStore}/products?limit=5` : null],
    queryFn: async () => {
      if (!activeStore) return null;
      const response = await fetch(`/api/stores/${activeStore}/products?limit=5`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!activeStore,
  });

  // Generate optimization opportunities (products with low CTR)
  const optimizationOpportunities = activeStore && products 
    ? products
      .filter((product: any) => product.ctr !== null && product.ctr < 2.0)
      .slice(0, 3)
    : [];

  // Show connect store view if no stores
  if (!storesLoading && (!stores || stores.length === 0)) {
    return (
      <SidebarLayout title="Dashboard">
        <Helmet>
          <title>Dashboard | CIP Shopee</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <ConnectStore />
        </div>
      </SidebarLayout>
    );
  }

  if (storesLoading) {
    return (
      <SidebarLayout title="Dashboard">
        <Helmet>
          <title>Dashboard | CIP Shopee</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Dashboard">
      <Helmet>
        <title>Dashboard | CIP Shopee</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das suas lojas e produtos na Shopee
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Período:</span>
            <div className="flex gap-1">
              {[
                { value: '7', label: '7d' },
                { value: '30', label: '30d' },
                { value: '90', label: '90d' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={period === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {activeStore && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSyncStore(activeStore)}
                disabled={syncStoreMutation.isPending}
                className="flex items-center gap-2"
              >
                {syncStoreMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sincronizar
                  </>
                )}
              </Button>

              <Button asChild>
                <Link href="/dashboard/products">
                  <Plus className="h-4 w-4 mr-2" />
                  Ver Produtos
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Store selector if multiple stores */}
        {stores?.length > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Loja ativa:</label>
                <select 
                  className="border border-input rounded-md bg-background p-2 min-w-[200px]"
                  value={activeStore || ''}
                  onChange={(e) => setActiveStore(parseInt(e.target.value))}
                >
                  {stores.map((store: any) => (
                    <option key={store.id} value={store.id}>
                      {store.shopName}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Store Stats */}
        <StoreStats 
          activeStore={activeStore} 
          storeMetrics={storeMetrics} 
          isLoading={storesLoading || metricsLoading} 
        />

        {/* Performance Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Performance da Loja</CardTitle>
            <CardDescription>Dados de desempenho dos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart metrics={storeMetrics} isLoading={metricsLoading} />
          </CardContent>
        </Card>

        {/* Products and Optimization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Produtos com Melhor Desempenho</CardTitle>
                <CardDescription>Produtos com maior CTR na sua loja</CardDescription>
              </div>
              <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/bulk-optimize">
                      <i className="ri-magic-line mr-1"></i>
                      Otimizar em Lote
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/products">
                      <i className="ri-eye-line mr-1"></i>
                      Ver todos
                    </Link>
                  </Button>
                </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products?.length > 0 ? (
                <ProductList 
                  products={products
                    .filter((p: any) => p.ctr !== null)
                    .sort((a: any, b: any) => (b.ctr || 0) - (a.ctr || 0))
                    .slice(0, 3)
                  } 
                />
              ) : (
                <div className="py-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum produto encontrado.</p>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/products">Gerenciar produtos</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optimization Opportunities */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Oportunidades de Otimização</CardTitle>
                <CardDescription>Produtos que podem melhorar com IA</CardDescription>
              </div>
              <Link href="/dashboard/products">
                <Button variant="ghost" size="sm">
                  Ver todos
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : optimizationOpportunities.length > 0 ? (
                <div className="space-y-1">
                  {optimizationOpportunities.map((product: any) => (
                    <OptimizationItem key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <p className="text-muted-foreground">Todos os seus produtos estão com bom desempenho!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Section */}
        {activeStore && (
          <InsightsSection storeId={activeStore} />
        )}

        {/* AI Credits Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-medium">Créditos de IA</h3>
                <p className="text-muted-foreground">
                  {user?.plan === 'free' ? (
                    `Você tem ${user?.aiCreditsLeft || 0} créditos de IA restantes no plano gratuito.`
                  ) : user?.plan === 'starter' ? (
                    `Você tem ${user?.aiCreditsLeft || 0} créditos de IA no plano Starter.`
                  ) : (
                    'Seu plano atual possui otimizações ilimitadas.'
                  )}
                </p>
              </div>
              {user?.plan === 'free' && (
                <Button asChild>
                  <Link href="/dashboard/subscription">Fazer upgrade</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}