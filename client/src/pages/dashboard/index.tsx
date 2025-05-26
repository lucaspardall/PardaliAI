import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import StoreStats from "@/components/dashboard/StoreStats";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import ProductList from "@/components/dashboard/ProductList";
import OptimizationItem from "@/components/dashboard/OptimizationItem";
import ConnectStore from "@/components/dashboard/ConnectStore";
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

  const queryClient = useQueryClient();

  // Fetch user's stores
  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ["/api/stores"],
  });

  const syncStoreMutation = useMutation({
    mutationFn: async (storeId: number) => {
      const response = await fetch(`/api/shopee/sync/${storeId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to sync store');
      }
      return response.json();
    },
    onSuccess: (data, storeId) => {
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: [activeStore ? `/api/stores/${activeStore}/products?limit=5` : null] });
      queryClient.invalidateQueries({ queryKey: [activeStore ? `/api/stores/${activeStore}/metrics` : null] });

      toast({
        title: "Sincronização concluída",
        description: `${data.processed} itens processados em ${Math.round(data.duration / 1000)}s`,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error?.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
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
    queryKey: [activeStore ? `/api/stores/${activeStore}/metrics` : null],
    enabled: !!activeStore,
  });

  // Fetch products for active store
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: [activeStore ? `/api/stores/${activeStore}/products?limit=5` : null],
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
        <ConnectStore />
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Dashboard">
      <Helmet>
        <title>Dashboard | CIP Shopee</title>
      </Helmet>

      {/* Store selector if multiple stores */}
      {stores?.length > 1 && (
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Selecionar loja:</label>
            <select 
              className="border border-input rounded-md bg-background p-2"
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
        </div>
      )}

      {/* Store Stats */}
      <StoreStats activeStore={activeStore} storeMetrics={storeMetrics} isLoading={storesLoading || metricsLoading} />

      {/* Performance Chart */}
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Performance da Loja</CardTitle>
            <CardDescription>Dados de desempenho dos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart metrics={storeMetrics} isLoading={metricsLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Products and Optimization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Produtos com Melhor Desempenho</CardTitle>
              <CardDescription>Produtos com maior CTR na sua loja</CardDescription>
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
                <i className="ri-shopping-bag-line text-3xl text-muted-foreground mb-2"></i>
                <p className="text-muted-foreground">Nenhum produto encontrado.</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/dashboard/products">Adicionar produtos</Link>
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
                <i className="ri-award-line text-3xl text-muted-foreground mb-2"></i>
                <p className="text-muted-foreground">Todos os seus produtos estão em bom desempenho!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Credits Info */}
      <div className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
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