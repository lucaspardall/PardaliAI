import React, { useState } from 'react';
import DemoSidebarLayout from '@/components/layout/DemoSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft, CheckCircle2, LightbulbIcon, Loader2, Rocket } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { generateDemoData } from '../../../../lib/demo-data';

export default function DemoOptimizeProduct({ params }: { params: { id: string } }) {
  // Estados para controle da otimização
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("current");
  
  // Gerar dados de demonstração
  const demoData = generateDemoData();
  const { user, stores, notifications, products, optimizations } = demoData;
  
  // Encontrar o produto pelo ID
  const productId = parseInt(params.id);
  const product = products.find(p => p.id === productId);
  
  // Encontrar otimização existente ou criar simulação
  const existingOptimization = optimizations.find(opt => opt.productId === productId);
  
  const optimization = existingOptimization || {
    id: Math.floor(Math.random() * 1000),
    productId,
    createdAt: new Date(),
    status: 'pending',
    originalTitle: product?.name,
    originalDesc: product?.description,
    originalKeywords: 'produto, shopee, venda, brasil, qualidade',
    suggestedTitle: product ? `${product.name} - Premium | Entrega Rápida` : '',
    suggestedDesc: product ? `${product.description}\n\n✅ Produto de alta qualidade\n✅ Entrega em todo Brasil\n✅ Garantia de 30 dias\n\nCompre agora e receba frete grátis!` : '',
    suggestedKeywords: 'premium, qualidade, frete grátis, garantia, oferta, promoção, melhor preço, entrega rápida',
    aiReasoning: 'Este produto teve sua descrição melhorada com palavras-chave estratégicas que aumentam a visibilidade nas buscas. Adicionamos elementos persuasivos como entrega rápida, garantia e destaque para a qualidade do produto. Estruturamos o texto com marcadores para facilitar a leitura.',
    percentageImprovement: 35.7,
    applied: false
  };
  
  // Função para simular o processo de otimização
  const startOptimization = () => {
    if (!product) return;
    
    setIsLoading(true);
    setProgress(0);
    
    // Simular progresso de otimização
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          setIsComplete(true);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };
  
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

  return (
    <DemoSidebarLayout demoData={{ user, stores, notifications }}>
      <div className="px-4 md:px-6 py-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/demo/product/${product.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Detalhes do Produto
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Otimizador de Produtos com IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-24 w-24 rounded-lg border overflow-hidden">
                    <img 
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">Categoria: {product.category}</p>
                    <p className="text-sm">R$ {product.price.toFixed(2)}</p>
                    <div className="mt-2">
                      {product.optimized ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Já Otimizado
                        </Badge>
                      ) : isComplete ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Otimização Completa
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Não Otimizado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {!isComplete && !product.optimized ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-primary/10">
                      <Rocket className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Otimize este produto com IA</h3>
                    <p className="text-muted-foreground mb-6">
                      Nossa inteligência artificial analisará seu produto e sugerirá melhorias para título, 
                      descrição e palavras-chave, aumentando suas chances de venda.
                    </p>
                    
                    <Button 
                      size="lg" 
                      className="w-full md:w-auto" 
                      onClick={startOptimization}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processando ({progress}%)
                        </>
                      ) : (
                        <>
                          <LightbulbIcon className="h-4 w-4 mr-2" />
                          Iniciar Otimização com IA
                        </>
                      )}
                    </Button>
                    
                    {isLoading && (
                      <div className="mt-6">
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300 ease-in-out"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {progress < 30 && "Analisando produto..."}
                          {progress >= 30 && progress < 60 && "Gerando sugestões..."}
                          {progress >= 60 && progress < 90 && "Otimizando conteúdo..."}
                          {progress >= 90 && "Finalizando..."}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-4">
                    <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="current">Conteúdo Atual</TabsTrigger>
                        <TabsTrigger value="suggested">Sugestões da IA</TabsTrigger>
                        <TabsTrigger value="analysis">Análise</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="current">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Título Atual</h3>
                            <div className="p-3 bg-secondary/50 rounded-md">
                              {optimization.originalTitle}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Descrição Atual</h3>
                            <div className="p-3 bg-secondary/50 rounded-md whitespace-pre-line">
                              {optimization.originalDesc}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Palavras-chave Atuais</h3>
                            <div className="p-3 bg-secondary/50 rounded-md">
                              {optimization.originalKeywords}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="suggested">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Título Sugerido</h3>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                              {optimization.suggestedTitle}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Descrição Sugerida</h3>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md whitespace-pre-line">
                              {optimization.suggestedDesc}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Palavras-chave Sugeridas</h3>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                              {optimization.suggestedKeywords}
                            </div>
                          </div>
                          
                          <Button className="w-full">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Aplicar Sugestões
                          </Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="analysis">
                        <div className="space-y-6">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-2 flex items-center">
                              <LightbulbIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                              Análise da IA
                            </h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {optimization.aiReasoning}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Melhorias Esperadas</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <Card>
                                <CardContent className="pt-6 text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    +{optimization.percentageImprovement.toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Aumento em Conversões
                                  </div>
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardContent className="pt-6 text-center">
                                  <div className="text-2xl font-bold text-amber-600">
                                    +30%
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Aumento em Visualizações
                                  </div>
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardContent className="pt-6 text-center">
                                  <div className="text-2xl font-bold text-blue-600">
                                    +25%
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Melhoria em SEO
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Comparativo</h3>
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <div>
                                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                    Conteúdo Original
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                    Conteúdo Otimizado
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                                <div style={{ width: "65%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                                <div style={{ width: "35%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              O conteúdo otimizado é mais completo, contém palavras-chave estratégicas, e possui
                              uma estrutura que melhora a legibilidade e a capacidade de converter visitantes em compradores.
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Benefícios da Otimização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Maior Visibilidade</h4>
                    <p className="text-sm text-muted-foreground">
                      Títulos e descrições otimizados aparecem com mais frequência nas buscas da Shopee.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Taxa de Conversão</h4>
                    <p className="text-sm text-muted-foreground">
                      Descrições persuasivas convertem mais visualizações em vendas efetivas.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Palavras-chave Estratégicas</h4>
                    <p className="text-sm text-muted-foreground">
                      Nossa IA identifica as palavras-chave mais buscadas pelos compradores.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Conteúdo Persuasivo</h4>
                    <p className="text-sm text-muted-foreground">
                      A IA destaca os pontos-chave que levam à decisão de compra.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Informações</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <strong>Otimização com CIP Shopee IA</strong> utiliza um algoritmo proprietário
                  treinado com milhares de produtos de sucesso na plataforma Shopee.
                </p>
                <p>
                  Cada otimização consome 1 crédito IA de sua conta. No plano atual,
                  você tem <strong>{user.aiCreditsLeft} créditos</strong> disponíveis.
                </p>
                <p>
                  Após a otimização, você pode aplicar as mudanças sugeridas com um único clique
                  ou editar manualmente conforme necessário.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DemoSidebarLayout>
  );
}