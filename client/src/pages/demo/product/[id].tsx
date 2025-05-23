import React, { useState } from 'react';
import DemoSidebarLayout from '@/components/layout/DemoSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { generateDemoData } from '@/lib/demo-data';
import { ArrowLeft, ChevronRight, Edit, Loader2, Share } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function DemoProductDetail({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Gerar dados de demonstração
  const demoData = generateDemoData();
  const { user, stores, notifications, products } = demoData;
  
  // Encontrar o produto pelo ID
  const productId = parseInt(params.id);
  const product = products.find(p => p.id === productId);
  
  // Se o produto não for encontrado, mostrar mensagem
  if (!product) {
    return (
      <DemoSidebarLayout demoData={{ user, stores, notifications }}>
        <div className="px-4 md:px-6 py-4 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/demo/products">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Produtos
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Produto não encontrado</h2>
                <p className="text-muted-foreground mt-2">
                  O produto que você está procurando não existe ou foi removido.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DemoSidebarLayout>
    );
  }
  
  // Encontrar a loja a que o produto pertence
  const store = stores.find(s => s.id === product.storeId);
  
  // Função para simular um clique no botão de otimização
  const handleOptimize = () => {
    setIsLoading(true);
    
    // Simular o carregamento por 1 segundo e redirecionar
    setTimeout(() => {
      window.location.href = `/demo/optimize/${product.id}`;
    }, 1000);
  };
  
  return (
    <DemoSidebarLayout demoData={{ user, stores, notifications }}>
      <div className="px-4 md:px-6 py-4 space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <Link href="/demo/products">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Produtos
              </Button>
            </Link>
          </div>
          <div className="space-x-2">
            <Button variant="outline">
              <Share className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button onClick={handleOptimize} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Otimizar com IA
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Detalhes do Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="rounded-md overflow-hidden border">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-auto object-cover aspect-square"
                      />
                    </div>
                  </div>
                  
                  <div className="w-full md:w-2/3 space-y-4">
                    <div>
                      <h2 className="text-2xl font-semibold">{product.name}</h2>
                      <p className="text-muted-foreground">
                        ID: {product.productId.substring(0, 8)}... • 
                        {store && <span> Loja: {store.shopName}</span>}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{product.category}</Badge>
                      {product.status === 'active' && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
                      )}
                      {product.status === 'out_of_stock' && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">Sem estoque</Badge>
                      )}
                      {product.status === 'inactive' && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">Inativo</Badge>
                      )}
                      {product.optimized && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">Otimizado por IA</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 my-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Preço</p>
                        <p className="text-lg font-medium">R$ {product.price.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Estoque</p>
                        <p className="text-lg font-medium">{product.stock} unidades</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Vendas</p>
                        <p className="text-lg font-medium">{product.sales} unidades</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Visualizações</p>
                        <p className="text-lg font-medium">{product.views}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                      <p className="text-lg font-medium">
                        {product.views > 0 ? ((product.sales / product.views) * 100).toFixed(2) : '0.00'}%
                      </p>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${product.views > 0 ? Math.min((product.sales / product.views) * 100, 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="description">
                  <TabsList>
                    <TabsTrigger value="description">Descrição</TabsTrigger>
                    <TabsTrigger value="analytics">Análise</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="pt-4 space-y-4">
                    <div className="whitespace-pre-line">
                      {product.description}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="analytics" className="pt-4">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Desempenho do Produto</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">
                                {product.views > 0 ? ((product.sales / product.views) * 100).toFixed(2) : '0.00'}%
                              </div>
                              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {product.views > 0 && (product.sales / product.views) * 100 >= 2.5 ? (
                                  <span className="text-green-600">Acima da média</span>
                                ) : (
                                  <span className="text-amber-600">Abaixo da média</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">
                                R$ {(product.revenue / product.sales).toFixed(2)}
                              </div>
                              <p className="text-sm text-muted-foreground">Ticket Médio</p>
                              <div className="mt-2 text-xs text-muted-foreground">
                                <span className="text-muted-foreground">Por venda</span>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">
                                R$ {product.revenue.toFixed(2)}
                              </div>
                              <p className="text-sm text-muted-foreground">Receita Total</p>
                              <div className="mt-2 text-xs text-muted-foreground">
                                <span className="text-muted-foreground">Últimos 30 dias</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium">Comparativo na Categoria</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Taxa de Conversão</span>
                              <span>{product.views > 0 ? ((product.sales / product.views) * 100).toFixed(2) : '0.00'}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full" 
                                style={{ width: `${product.views > 0 ? Math.min((product.sales / product.views) * 100 * 10, 100) : 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Média da categoria: 2.5%
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Visualizações</span>
                              <span>{product.views}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full" 
                                style={{ width: `${Math.min((product.views / 500) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Média da categoria: 500 visualizações
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Receita</span>
                              <span>R$ {product.revenue.toFixed(2)}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full" 
                                style={{ width: `${Math.min((product.revenue / 1000) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Média da categoria: R$ 1.000,00
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="pt-4">
                    <div className="space-y-4">
                      <div className="text-sm">
                        <p>Criado em: {product.createdAt.toLocaleDateString('pt-BR')}</p>
                        <p>Última atualização: {product.updatedAt.toLocaleDateString('pt-BR')}</p>
                        <p>Última sincronização: {product.lastSyncAt.toLocaleDateString('pt-BR')}</p>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Histórico de Atualizações</h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-100 text-blue-700 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                              <Edit className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">Produto sincronizado da Shopee</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(product.createdAt.getTime() - 86400000 * 2).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          
                          {product.optimized && (
                            <div className="flex items-start gap-3">
                              <div className="bg-green-100 text-green-700 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                                <Edit className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">Produto otimizado com IA</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(product.updatedAt.getTime() - 86400000).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-3">
                            <div className="bg-slate-100 text-slate-700 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                              <Edit className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">Estoque atualizado</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(product.lastSyncAt.getTime() - 3600000).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="secondary" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar na Shopee
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={handleOptimize}>
                  <Edit className="h-4 w-4 mr-2" />
                  Otimizar com IA
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Share className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recomendações de IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm">
                    Aprimore seu produto com otimização baseada em inteligência artificial.
                  </p>
                  
                  {product.optimized ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 mb-2">Já Otimizado</Badge>
                  ) : (
                    <Badge variant="outline" className="mb-2">Não Otimizado</Badge>
                  )}
                  
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex">
                      <ChevronRight className="h-4 w-4 mr-2 shrink-0 text-primary" />
                      Melhore o título com palavras-chave estratégicas
                    </li>
                    <li className="flex">
                      <ChevronRight className="h-4 w-4 mr-2 shrink-0 text-primary" />
                      Reestruture a descrição para converter melhor
                    </li>
                    <li className="flex">
                      <ChevronRight className="h-4 w-4 mr-2 shrink-0 text-primary" />
                      Obtenha palavras-chave otimizadas para seu produto
                    </li>
                  </ul>
                </div>
                
                {!product.optimized && (
                  <Button className="w-full" onClick={handleOptimize} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
                    Otimizar Agora
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Produtos Semelhantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products
                    .filter(p => p.category === product.category && p.id !== product.id)
                    .slice(0, 3)
                    .map(p => (
                      <div key={p.id} className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-md overflow-hidden border shrink-0">
                          <img 
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="text-sm">
                          <Link href={`/demo/product/${p.id}`}>
                            <p className="font-medium leading-tight hover:text-primary">{p.name}</p>
                          </Link>
                          <p className="text-muted-foreground">R$ {p.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DemoSidebarLayout>
  );
}