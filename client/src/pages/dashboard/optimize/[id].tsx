import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatCTR, formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { Helmet } from "react-helmet";

export default function OptimizeProduct() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isApplying, setIsApplying] = useState(false);
  const [isIgnoring, setIsIgnoring] = useState(false);
  
  // Fetch product details
  const { 
    data: product, 
    isLoading: productLoading,
    isError: productError
  } = useQuery({
    queryKey: [`/api/products/${id}`],
  });
  
  // State for optimization
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  
  // Handle product optimization
  const optimizeProductMutation = useMutation({
    mutationFn: async () => {
      setOptimizationLoading(true);
      setOptimizationError(null);
      try {
        const response = await apiRequest("POST", `/api/products/${id}/optimize`);
        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          setOptimizationError(error.message);
        } else {
          setOptimizationError("An unknown error occurred");
        }
        throw error;
      } finally {
        setOptimizationLoading(false);
      }
    },
    onSuccess: (data) => {
      setOptimizationResult(data);
      toast({
        title: "Otimização concluída",
        description: "A otimização do produto foi concluída com sucesso.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na otimização",
        description: error.message || "Ocorreu um erro ao otimizar o produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Run optimization on load
  useEffect(() => {
    if (product && !optimizationResult && !optimizationLoading && !optimizationError) {
      optimizeProductMutation.mutate();
    }
  }, [product]);
  
  // Handle optimization application
  const applyOptimizationMutation = useMutation({
    mutationFn: async () => {
      setIsApplying(true);
      try {
        if (!optimizationResult?.optimization?.id) {
          throw new Error("ID de otimização não encontrado");
        }
        return apiRequest(
          "PUT", 
          `/api/optimizations/${optimizationResult.optimization.id}/status`, 
          { status: "applied" }
        );
      } catch (error) {
        throw error;
      } finally {
        setIsApplying(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Otimização aplicada",
        description: "As alterações foram aplicadas ao produto com sucesso.",
        variant: "success",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}/optimizations`] });
      
      // Redirect to product detail page
      setTimeout(() => {
        window.location.href = `/dashboard/product/${id}`;
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aplicar otimização",
        description: error.message || "Ocorreu um erro ao aplicar a otimização. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Handle optimization ignore
  const ignoreOptimizationMutation = useMutation({
    mutationFn: async () => {
      setIsIgnoring(true);
      try {
        if (!optimizationResult?.optimization?.id) {
          throw new Error("ID de otimização não encontrado");
        }
        return apiRequest(
          "PUT", 
          `/api/optimizations/${optimizationResult.optimization.id}/status`, 
          { status: "ignored" }
        );
      } catch (error) {
        throw error;
      } finally {
        setIsIgnoring(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Otimização ignorada",
        description: "A otimização foi ignorada e não será aplicada ao produto.",
        variant: "success",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}/optimizations`] });
      
      // Redirect to product detail page
      setTimeout(() => {
        window.location.href = `/dashboard/product/${id}`;
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao ignorar otimização",
        description: error.message || "Ocorreu um erro ao ignorar a otimização. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Highlight added/changed text
  const highlightChanges = (original: string, suggested: string) => {
    if (!original || !suggested) return suggested || '';
    
    // Very simple diff logic - for a real app, use a proper diff library
    const words1 = original.split(' ');
    const words2 = suggested.split(' ');
    
    const result = words2.map(word => {
      if (!words1.includes(word)) {
        return `<span class="bg-yellow-100 dark:bg-yellow-900/30 px-1">${word}</span>`;
      }
      return word;
    }).join(' '); ');
    
    return result;
  };

  // Handle errors
  if (productError || (product === undefined && !productLoading)) {
    return (
      <SidebarLayout title="Erro ao carregar produto">
        <div className="py-12 text-center">
          <i className="ri-error-warning-line text-4xl text-muted-foreground mb-3"></i>
          <h2 className="text-2xl font-bold mb-2">Produto não encontrado</h2>
          <p className="text-muted-foreground">
            O produto que você está tentando otimizar não existe ou foi removido.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/products">Voltar para lista de produtos</Link>
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Otimizar Produto">
      <Helmet>
        <title>Otimizar Produto | CIP Shopee</title>
      </Helmet>
      
      <div className="mb-6">
        <Link href={`/dashboard/product/${id}`}>
          <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <i className="ri-arrow-left-line mr-1"></i> Voltar para detalhes do produto
          </a>
        </Link>
      </div>
      
      {/* Optimization Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Otimização de Produto com IA</h2>
              <p className="text-muted-foreground mt-1">
                Melhore a performance do seu produto com sugestões inteligentes
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              <span className="text-muted-foreground mr-2">Créditos de IA restantes:</span>
              <span className="font-medium">
                {user?.plan !== 'free' 
                  ? 'Ilimitado' 
                  : (optimizationResult ? optimizationResult.creditsLeft : user?.aiCreditsLeft) + '/10'}
              </span>
            </div>
          </div>
          
          {productLoading ? (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ) : product && (
            <div className="flex items-center">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-16 h-16 rounded-md object-cover mr-4"
                />
              ) : (
                <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center mr-4">
                  <i className="ri-shopping-bag-line text-muted-foreground text-2xl"></i>
                </div>
              )}
              <div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {product.category ? `${product.category} • ` : ''}
                  ID: {product.productId.substring(0, 10)}...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Optimization Content */}
      {optimizationLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : optimizationError ? (
        <Card className="p-6 text-center">
          <i className="ri-error-warning-line text-4xl text-destructive mb-3"></i>
          <h3 className="text-xl font-bold mb-2">Erro ao otimizar produto</h3>
          <p className="text-muted-foreground mb-4">
            {optimizationError === "Unauthorized" 
              ? "Você precisa estar autenticado para otimizar produtos." 
              : optimizationError.includes("No AI credits") 
              ? "Você não possui créditos de IA suficientes. Faça upgrade do seu plano para continuar." 
              : optimizationError}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
            <Button asChild>
              <Link href="/dashboard/subscription">Fazer upgrade</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/product/${id}`}>Voltar ao produto</Link>
            </Button>
          </div>
        </Card>
      ) : optimizationResult ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Content */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                    <span className="text-muted-foreground font-medium">A</span>
                  </div>
                  <CardTitle>Versão Atual</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="title" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="title">Título</TabsTrigger>
                    <TabsTrigger value="description">Descrição</TabsTrigger>
                    <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="title" className="mt-6">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Título do Produto
                      </label>
                      <div className="bg-muted p-3 rounded-md border border-border">
                        {optimizationResult.optimization.originalTitle || product.name}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="description" className="mt-6">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Descrição do Produto
                      </label>
                      <div className="bg-muted p-3 rounded-md border border-border h-48 overflow-auto whitespace-pre-line">
                        {optimizationResult.optimization.originalDesc || product.description || "Sem descrição disponível."}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="keywords" className="mt-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Palavras-chave
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(optimizationResult.optimization.originalKeywords || '').split(',').map((keyword: string, i: number) => (
                          keyword.trim() && (
                            <Badge key={i} variant="outline" className="bg-muted border-muted-foreground/20">
                              {keyword.trim()}
                            </Badge>
                          )
                        ))}
                        {(!optimizationResult.optimization.originalKeywords || optimizationResult.optimization.originalKeywords.length === 0) && (
                          <span className="text-muted-foreground text-sm">Nenhuma palavra-chave disponível</span>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* AI Optimized Content */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <i className="ri-ai-generate text-primary text-sm"></i>
                  </div>
                  <CardTitle>Versão Otimizada com IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="title" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="title">Título</TabsTrigger>
                    <TabsTrigger value="description">Descrição</TabsTrigger>
                    <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="title" className="mt-6">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Título do Produto
                      </label>
                      <div 
                        className="bg-primary/5 p-3 rounded-md border border-primary/20"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightChanges(
                            optimizationResult.optimization.originalTitle || product.name,
                            optimizationResult.optimization.suggestedTitle
                          )
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="description" className="mt-6">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Descrição do Produto
                      </label>
                      <div 
                        className="bg-primary/5 p-3 rounded-md border border-primary/20 h-48 overflow-auto"
                        dangerouslySetInnerHTML={{ 
                          __html: optimizationResult.optimization.suggestedDesc.replace(/\n/g, '<br />') 
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="keywords" className="mt-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Palavras-chave
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(optimizationResult.optimization.suggestedKeywords || '').split(',').map((keyword: string, i: number) => (
                          keyword.trim() && (
                            <Badge key={i} variant="outline" className="bg-primary/10 border-primary/20 text-primary-foreground">
                              {keyword.trim()}
                            </Badge>
                          )
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Explanation */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Análise e Recomendações da IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Por que estas otimizações melhorarão o desempenho?</h4>
                <div className="whitespace-pre-line">
                  {optimizationResult.optimization.reasoningNotes || 
                    "A inteligência artificial analisou seu produto e otimizou o conteúdo para melhorar o CTR e a conversão."}
                </div>
              </div>
              
              {optimizationResult.request.output && (
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Impacto Estimado</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-background shadow-sm">
                      <CardContent className="p-3">
                        <div className="text-sm text-muted-foreground">CTR Estimado</div>
                        <div className="flex items-baseline">
                          <span className="text-xl font-semibold">
                            +{optimizationResult.request.output.impact.ctrImprovement}%
                          </span>
                          <span className="ml-1 text-green-600 dark:text-green-400 text-sm">
                            (~{(product.ctr ? product.ctr * (1 + optimizationResult.request.output.impact.ctrImprovement / 100) : 3.5).toFixed(1)}%)
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-background shadow-sm">
                      <CardContent className="p-3">
                        <div className="text-sm text-muted-foreground">Conversão Estimada</div>
                        <div className="flex items-baseline">
                          <span className="text-xl font-semibold">
                            +{optimizationResult.request.output.impact.conversionImprovement}%
                          </span>
                          <span className="ml-1 text-green-600 dark:text-green-400 text-sm">aumento</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-background shadow-sm">
                      <CardContent className="p-3">
                        <div className="text-sm text-muted-foreground">Competitividade</div>
                        <div className="flex items-baseline">
                          <span className="text-xl font-semibold">Alta</span>
                          <span className="ml-1 text-amber-600 dark:text-amber-400 text-sm">melhoria</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row justify-between">
            <div className="mt-4 sm:mt-0">
              <Button 
                variant="outline" 
                onClick={() => ignoreOptimizationMutation.mutate()}
                disabled={isIgnoring || isApplying}
              >
                {isIgnoring ? (
                  <>
                    <i className="ri-loader-2-line animate-spin mr-2"></i> 
                    Ignorando...
                  </>
                ) : (
                  <>
                    <i className="ri-arrow-go-back-line mr-2"></i> 
                    Ignorar
                  </>
                )}
              </Button>
              <Link href={`/dashboard/product/${id}`}>
                <Button variant="outline" className="ml-3" disabled={isIgnoring || isApplying}>
                  <i className="ri-close-line mr-2"></i> 
                  Cancelar
                </Button>
              </Link>
            </div>
            <Button 
              onClick={() => applyOptimizationMutation.mutate()}
              disabled={isApplying || isIgnoring}
            >
              {isApplying ? (
                <>
                  <i className="ri-loader-2-line animate-spin mr-2"></i> 
                  Aplicando...
                </>
              ) : (
                <>
                  <i className="ri-check-line mr-2"></i> 
                  Aplicar Otimizações
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <Card className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Preparando otimização...</h3>
            <p className="text-muted-foreground">
              Nossa inteligência artificial está analisando seu produto para sugerir melhorias.
            </p>
          </div>
        </Card>
      )}
    </SidebarLayout>
  );
}
