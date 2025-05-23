import React from 'react';
import DemoSidebarLayout from '@/components/layout/DemoSidebarLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  Eye,
  PackageOpen,
  Percent,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  XCircle
} from 'lucide-react';
import { generateDemoData } from '../../../../lib/demo-data';

export default function DemoProductDetail({ params }: { params: { id: string } }) {
  // Gerar dados de demonstração
  const demoData = generateDemoData();
  const { user, stores, notifications, products } = demoData;
  
  // Encontrar o produto pelo ID
  const productId = parseInt(params.id);
  const product = products.find(p => p.id === productId);
  
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

  // Renderizar status do produto
  const renderStatus = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <XCircle className="h-3 w-3 mr-1" />
            Inativo
          </Badge>
        );
      case 'out_of_stock':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Sem Estoque
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Histórico fictício de vendas (últimos 7 dias)
  const salesHistory = Array(7).fill(null).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      sales: Math.floor(Math.random() * 10),
      views: Math.floor(Math.random() * 100) + 10
    };
  }).reverse();

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
          
          {!product.optimized && (
            <Link href={`/demo/optimize/${product.id}`}>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                Otimizar Produto
              </Button>
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription>ID: {product.productId}</CardDescription>
                  </div>
                  <div className="mt-2 md:mt-0">
                    {renderStatus(product.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                    <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                    <TabsTrigger value="description">Descrição</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="aspect-square rounded-lg overflow-hidden">
                        <img 
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Tag className="h-5 w-5 text-muted-foreground mr-2" />
                          <div>
                            <div className="text-sm font-medium">Categoria</div>
                            <div className="text-lg">{product.category}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                          <div>
                            <div className="text-sm font-medium">Preço</div>
                            <div className="text-lg">R$ {product.price.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <PackageOpen className="h-5 w-5 text-muted-foreground mr-2" />
                          <div>
                            <div className="text-sm font-medium">Estoque</div>
                            <div className="text-lg">{product.stock} unidades</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-muted-foreground mr-2" />
                          <div>
                            <div className="text-sm font-medium">Avaliação</div>
                            <div className="text-lg">{product.rating.toFixed(1)}/5.0 ⭐</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                          <div>
                            <div className="text-sm font-medium">Criado em</div>
                            <div className="text-lg">{product.createdAt.toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                          <div>
                            <div className="text-sm font-medium">Última sincronização</div>
                            <div className="text-lg">{product.lastSyncAt.toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stats">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center">
                            <ShoppingCart className="h-5 w-5 text-muted-foreground mr-2" />
                            <div className="text-2xl font-bold">{product.sales}</div>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            <div className="text-xs font-medium">Histórico de Vendas (7 dias)</div>
                            <div className="h-[100px] flex items-end gap-1">
                              {salesHistory.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                  <div className="text-xs text-muted-foreground">{day.sales}</div>
                                  <div 
                                    className="w-full bg-primary/30 rounded-t"
                                    style={{ height: `${Math.max(10, (day.sales / 10) * 100)}%` }}
                                  ></div>
                                  <div className="text-xs mt-1">{day.date}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center">
                            <Eye className="h-5 w-5 text-muted-foreground mr-2" />
                            <div className="text-2xl font-bold">{product.views}</div>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            <div className="text-xs font-medium">Taxa de Conversão</div>
                            <div className="flex items-center">
                              <Percent className="h-4 w-4 text-muted-foreground mr-2" />
                              <div className="text-lg font-medium">{product.conversionRate.toFixed(1)}%</div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Conversão = Vendas / Visualizações × 100
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Receita</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                            <div className="text-2xl font-bold">R$ {product.revenue.toFixed(2)}</div>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            <div className="text-xs font-medium">Ticket Médio</div>
                            <div className="text-lg font-medium">
                              R$ {(product.revenue / Math.max(1, product.sales)).toFixed(2)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Otimização</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center">
                            {product.optimized ? (
                              <>
                                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                                <div className="text-lg font-bold text-green-600">Otimizado</div>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                                <div className="text-lg font-bold text-red-600">Não Otimizado</div>
                              </>
                            )}
                          </div>
                          
                          <div className="mt-4">
                            {product.optimized ? (
                              <div className="text-sm text-muted-foreground">
                                Este produto já foi otimizado pelo CIP Shopee, aumentando suas chances de vendas.
                              </div>
                            ) : (
                              <Link href={`/demo/optimize/${product.id}`}>
                                <Button className="w-full">
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Otimizar Agora
                                </Button>
                              </Link>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="description">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                          <h2>Descrição do Produto</h2>
                          <p>{product.description}</p>
                          
                          <h3>Informações de Entrega</h3>
                          <ul>
                            <li>Entrega em todo Brasil</li>
                            <li>Prazo de envio: 1-3 dias úteis</li>
                            <li>Frete grátis para compras acima de R$ 99,00</li>
                          </ul>
                          
                          <h3>Garantia</h3>
                          <p>Garantia de 30 dias contra defeitos de fabricação.</p>
                        </div>
                      </CardContent>
                    </Card>
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
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Produto
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Truck className="h-4 w-4 mr-2" />
                  Gerenciar Estoque
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Relatório Completo
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recomendações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!product.optimized && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                    <h4 className="font-medium text-amber-800 dark:text-amber-300 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Otimização Recomendada
                    </h4>
                    <p className="text-sm mt-1 text-amber-700 dark:text-amber-400">
                      Este produto ainda não foi otimizado para aumentar a visibilidade e conversões.
                    </p>
                    <Link href={`/demo/optimize/${product.id}`}>
                      <Button className="mt-2 w-full" variant="outline">
                        Otimizar Agora
                      </Button>
                    </Link>
                  </div>
                )}
                
                {product.stock < 10 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md">
                    <h4 className="font-medium text-red-800 dark:text-red-300 flex items-center">
                      <PackageOpen className="h-4 w-4 mr-2" />
                      Estoque Baixo
                    </h4>
                    <p className="text-sm mt-1 text-red-700 dark:text-red-400">
                      Este produto está com estoque baixo. Recomendamos reabastecer em breve.
                    </p>
                    <Button className="mt-2 w-full" variant="outline">
                      Reabastecer Estoque
                    </Button>
                  </div>
                )}
                
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md">
                  <h4 className="font-medium text-green-800 dark:text-green-300 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Potencial de Vendas
                  </h4>
                  <p className="text-sm mt-1 text-green-700 dark:text-green-400">
                    Este produto tem bom potencial de vendas. Considere investir em promoções.
                  </p>
                  <Button className="mt-2 w-full" variant="outline">
                    Criar Promoção
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DemoSidebarLayout>
  );
}