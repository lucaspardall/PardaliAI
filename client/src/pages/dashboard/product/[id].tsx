import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { 
  formatCurrency, 
  formatCTR, 
  formatNumber, 
  formatDate, 
  formatPercentage 
} from "@/lib/utils/formatters";
import { getStatusIcon, getStatusColorClass } from "@/lib/utils/icons";
import { Product, ProductOptimization } from "@/lib/types";
import { Helmet } from "react-helmet";
import { Security } from "@/lib/utils/security";

export default function ProductDetail() {
  const { id } = useParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: [`/api/products/${id}`],
  });

  // Fetch product optimizations
  const { data: optimizations, isLoading: optimizationsLoading } = useQuery({
    queryKey: [`/api/products/${id}/optimizations`],
  });

  // Generate sample performance data for the chart
  const generatePerformanceData = (product: Product) => {
    if (!product) return [];

    const baseDate = new Date();
    const baseCtr = product.ctr || 2;
    const baseViews = product.views || 100;
    const baseSales = product.sales || 5;

    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - (6 - i));

      // Add some randomness to create realistic looking data
      const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
      const trendFactor = 1 + (i * 0.02); // Slight upward trend

      return {
        date: formatDate(date),
        ctr: parseFloat((baseCtr * randomFactor * trendFactor).toFixed(2)),
        views: Math.floor(baseViews * randomFactor * trendFactor),
        sales: Math.floor(baseSales * randomFactor * trendFactor)
      };
    });
  };

  // Get CTR badge variant
  const getCtrBadgeVariant = (ctr: number | undefined) => {
    if (!ctr) return "outline";
    if (ctr >= 4) return "success";
    if (ctr >= 2) return "warning";
    return "destructive";
  };

  // Handle image selection
  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center text-sm mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="mr-2">{entry.name}:</span>
              <span className="font-medium">
                {entry.name === 'CTR' 
                  ? formatCTR(entry.value) 
                  : formatNumber(entry.value)
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (productLoading) {
    return (
      <SidebarLayout title="Detalhes do Produto">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <Skeleton className="h-80 w-full rounded-lg" />
              <div className="mt-4 grid grid-cols-4 gap-2">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            </div>
            <div className="md:w-2/3 space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!product) {
    return (
      <SidebarLayout title="Produto não encontrado">
        <div className="py-12 text-center">
          <i className="ri-error-warning-line text-4xl text-muted-foreground mb-3"></i>
          <h2 className="text-2xl font-bold mb-2">Produto não encontrado</h2>
          <p className="text-muted-foreground">
            O produto que você está procurando não existe ou foi removido.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/products">Voltar para lista de produtos</Link>
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  const performanceData = generatePerformanceData(product);
  const safeProduct = Security.sanitizeProductData(product);

  return (
    <SidebarLayout title="Detalhes do Produto">
      <Helmet>
        <title>{safeProduct.name} | CIP Shopee</title>
      </Helmet>

      <div className="mb-6">
        <Link href="/dashboard/products">
          <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <i className="ri-arrow-left-line mr-1"></i> Voltar para lista de produtos
          </a>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Product Images */}
        <div className="md:w-1/3 flex-shrink-0">
          <div className="bg-background border rounded-lg overflow-hidden shadow-sm">
            {safeProduct.images && safeProduct.images.length > 0 ? (
              <img 
                src={safeProduct.images[selectedImageIndex]} 
                alt={safeProduct.name} 
                className="w-full h-80 object-contain"
              />
            ) : (
              <div className="w-full h-80 flex items-center justify-center bg-muted">
                <i className="ri-image-line text-4xl text-muted-foreground"></i>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {safeProduct.images && safeProduct.images.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {safeProduct.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`border rounded-md cursor-pointer overflow-hidden h-16 ${
                    selectedImageIndex === index ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                  onClick={() => handleImageSelect(index)}
                >
                  <img 
                    src={image} 
                    alt={`${safeProduct.name} - Imagem ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="md:w-2/3">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{safeProduct.name}</h1>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge variant={safeProduct.status === 'active' ? 'success' : 'secondary'}>
                  <i className={`${getStatusIcon(safeProduct.status)} mr-1`}></i>
                  {safeProduct.status === 'active' ? 'Ativo' : safeProduct.status === 'inactive' ? 'Inativo' : 'Excluído'}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  ID: {safeProduct.productId}
                </span>
              </div>
            </div>
            <span className="text-2xl font-bold">{formatCurrency(safeProduct.price)}</span>
          </div>

          {/* Product Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">CTR</div>
                <div className="text-2xl font-semibold mt-1">{formatCTR(safeProduct.ctr)}</div>
                <Badge variant={getCtrBadgeVariant(safeProduct.ctr)} className="mt-1">
                  {safeProduct.ctr && safeProduct.ctr >= 3 ? 'Bom' : safeProduct.ctr && safeProduct.ctr >= 2 ? 'Médio' : 'Precisa melhorar'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Visualizações</div>
                <div className="text-2xl font-semibold mt-1">{safeProduct.views ? formatNumber(safeProduct.views) : '-'}</div>
                <div className="text-xs text-muted-foreground mt-1">Últimos 30 dias</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Vendas</div>
                <div className="text-2xl font-semibold mt-1">{safeProduct.sales ? formatNumber(safeProduct.sales) : '-'}</div>
                <div className="text-xs text-muted-foreground mt-1">Últimos 30 dias</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Estoque</div>
                <div className="text-2xl font-semibold mt-1">{formatNumber(safeProduct.stock)}</div>
                <Badge variant={safeProduct.stock > 10 ? 'success' : safeProduct.stock > 0 ? 'warning' : 'destructive'} className="mt-1">
                  {safeProduct.stock > 10 ? 'Em estoque' : safeProduct.stock > 0 ? 'Estoque baixo' : 'Indisponível'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line">
                {safeProduct.description || "Nenhuma descrição disponível."}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/dashboard/optimize/${safeProduct.id}`}>
                <i className="ri-ai-generate mr-2"></i> Otimizar com IA
              </Link>
            </Button>
            <Button variant="outline">
              <i className="ri-history-line mr-2"></i> Histórico
            </Button>
            <Button variant="outline">
              <i className="ri-edit-line mr-2"></i> Editar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for metrics and optimizations */}
      <div className="mt-8">
        <Tabs defaultValue="performance">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:space-x-2">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="optimizations">
              Otimizações
              {optimizations && optimizations.length > 0 && (
                <Badge variant="secondary" className="ml-2">{optimizations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance do Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickMargin={10}
                      />
                      <YAxis 
                        yAxisId="left" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickMargin={10}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickMargin={10}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="views"
                        name="Visualizações"
                        stroke="hsl(var(--chart-1))"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sales"
                        name="Vendas"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ctr"
                        name="CTR"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimizations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Otimizações</CardTitle>
              </CardHeader>
              <CardContent>
                {optimizationsLoading ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : !optimizations || optimizations.length === 0 ? (
                  <div className="py-12 text-center">
                    <i className="ri-ai-generate text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-lg font-medium">Nenhuma otimização encontrada</p>
                    <p className="text-muted-foreground mt-1">Este produto ainda não foi otimizado.</p>
                    <Button asChild className="mt-4">
                      <Link href={`/dashboard/optimize/${safeProduct.id}`}>
                        Otimizar agora
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {optimizations.map((optimization: ProductOptimization) => (
                      <div key={optimization.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">
                              Otimização {formatDate(optimization.createdAt)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {optimization.status === 'applied' 
                                ? `Aplicada em ${optimization.appliedAt ? formatDate(optimization.appliedAt) : 'N/A'}` 
                                : optimization.status === 'ignored' 
                                ? 'Ignorada pelo usuário' 
                                : 'Pendente de aplicação'}
                            </p>
                          </div>
                          <Badge variant={
                            optimization.status === 'applied' 
                              ? 'success' 
                              : optimization.status === 'ignored' 
                              ? 'destructive' 
                              : 'secondary'
                          }>
                            <i className={`${getStatusIcon(optimization.status)} mr-1`}></i>
                            {optimization.status === 'applied' 
                              ? 'Aplicado' 
                              : optimization.status === 'ignored' 
                              ? 'Ignorado' 
                              : 'Pendente'}
                          </Badge>
                        </div>

                        <Tabs defaultValue="title">
                          <TabsList>
                            <TabsTrigger value="title">Título</TabsTrigger>
                            <TabsTrigger value="description">Descrição</TabsTrigger>
                            <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
                          </TabsList>

                          <TabsContent value="title" className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Original:</p>
                              <div className="bg-muted p-3 rounded-md text-sm">
                                {optimization.originalTitle || "Não disponível"}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Sugerido:</p>
                              <div className="bg-primary/5 border-primary/20 border p-3 rounded-md text-sm">
                                {optimization.suggestedTitle || "Não disponível"}
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="description" className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Original:</p>
                              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line max-h-48 overflow-auto">
                                {optimization.originalDesc || "Não disponível"}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Sugerido:</p>
                              <div className="bg-primary/5 border-primary/20 border p-3 rounded-md text-sm whitespace-pre-line max-h-48 overflow-auto">
                                {optimization.suggestedDesc || "Não disponível"}
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="keywords" className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Original:</p>
                              <div className="bg-muted p-3 rounded-md text-sm">
                                {optimization.originalKeywords 
                                  ? optimization.originalKeywords.split(',').map((keyword, i) => (
                                      <Badge key={i} variant="secondary" className="mr-2 mb-2">
                                        {keyword.trim()}
                                      </Badge>
                                    ))
                                  : "Não disponível"}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Sugerido:</p>
                              <div className="bg-primary/5 border-primary/20 border p-3 rounded-md text-sm">
                                {optimization.suggestedKeywords 
                                  ? optimization.suggestedKeywords.split(',').map((keyword, i) => (
                                      <Badge key={i} variant="outline" className="mr-2 mb-2 bg-primary/10">
                                        {keyword.trim()}
                                      </Badge>
                                    ))
                                  : "Não disponível"}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>

                        {optimization.reasoningNotes && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-1">Análise da IA:</p>
                            <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-line">
                              {optimization.reasoningNotes}
                            </div>
                          </div>
                        )}

                        {optimization.status === 'pending' && (
                          <div className="mt-4 flex gap-3">
                            <Button size="sm" className="w-full sm:w-auto">
                              Aplicar otimização
                            </Button>
                            <Button size="sm" variant="outline" className="w-full sm:w-auto">
                              Ignorar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}