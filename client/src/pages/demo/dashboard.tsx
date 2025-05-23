import React, { useEffect, useState } from 'react';
import DemoSidebarLayout from '@/components/layout/DemoSidebarLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { BadgePlus, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';

// Dados simulados para a demo
const generateDemoData = () => {
  // Dados do usuário
  const user = {
    id: '99999999',
    firstName: 'Teste',
    lastName: 'Shopee',
    email: 'teste@shopee.demo',
    profileImageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=TS&backgroundColor=FF5722`,
    plan: 'pro',
    planStatus: 'active',
    aiCreditsLeft: 100,
    storeLimit: 10
  };

  // Loja virtual
  const stores = Array(3).fill(null).map((_, index) => ({
    id: index + 1,
    shopName: faker.company.name(),
    shopRegion: 'BR',
    totalProducts: faker.number.int({ min: 35, max: 120 }),
    lastSyncAt: faker.date.recent(),
    isActive: true,
    monthlyRevenue: faker.number.float({ min: 2000, max: 15000, precision: 0.01 }),
    monthlySales: faker.number.int({ min: 20, max: 200 }),
    totalViews: faker.number.int({ min: 500, max: 5000 }),
    averageCtr: faker.number.float({ min: 1.5, max: 4.5, precision: 0.01 }),
  }));

  // Produtos para a primeira loja
  const products = Array(12).fill(null).map((_, index) => ({
    id: index + 1,
    storeId: 1,
    name: faker.commerce.productName(),
    productId: faker.string.alphanumeric(10),
    description: faker.commerce.productDescription(),
    price: faker.number.float({ min: 19.99, max: 299.99, precision: 0.01 }),
    stock: faker.number.int({ min: 0, max: 100 }),
    category: faker.commerce.department(),
    image: `https://picsum.photos/seed/${index + 100}/300/300`,
    isOptimized: faker.datatype.boolean(),
    sales: faker.number.int({ min: 0, max: 50 }),
    views: faker.number.int({ min: 10, max: 500 }),
    ctr: faker.number.float({ min: 1, max: 8, precision: 0.1 }),
    revenue: faker.number.float({ min: 0, max: 3000, precision: 0.01 }),
  }));

  // Notificações
  const notifications = Array(5).fill(null).map((_, index) => ({
    id: index + 1,
    title: faker.helpers.arrayElement([
      'Novo produto adicionado',
      'Otimização concluída',
      'Alerta de estoque baixo',
      'Nova venda registrada',
      'Sincronização concluída'
    ]),
    message: faker.helpers.arrayElement([
      'Seu produto foi otimizado com sucesso!',
      'Um dos seus produtos está com estoque baixo.',
      'Parabéns! Você teve 5 novas vendas hoje.',
      'Dados da sua loja foram sincronizados.',
      'Uma nova análise de performance está disponível.'
    ]),
    type: faker.helpers.arrayElement(['success', 'warning', 'info', 'error']),
    isRead: faker.datatype.boolean(),
    createdAt: faker.date.recent(),
    actionUrl: '#'
  }));

  // Métricas da loja (últimos 7 dias)
  const metrics = Array(7).fill(null).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    
    return {
      date: date.toISOString().split('T')[0],
      views: faker.number.int({ min: 50, max: 300 }),
      sales: faker.number.int({ min: 2, max: 30 }),
      revenue: faker.number.float({ min: 100, max: 3000, precision: 0.01 }),
      ctr: faker.number.float({ min: 1, max: 5, precision: 0.01 }),
    };
  });

  // Otimizações de produtos
  const optimizations = Array(5).fill(null).map((_, index) => ({
    id: index + 1,
    productId: faker.number.int({ min: 1, max: 10 }),
    status: faker.helpers.arrayElement(['pending', 'completed', 'applied', 'ignored']),
    originalTitle: faker.commerce.productName(),
    originalDesc: faker.commerce.productDescription(),
    originalKeywords: faker.helpers.arrayElements([
      'shopee', 'produto', 'oferta', 'desconto', 'casa', 
      'beleza', 'eletrônico', 'gadget', 'moda', 'acessório'
    ], faker.number.int({ min: 3, max: 6 })).join(', '),
    suggestedTitle: faker.commerce.productName(),
    suggestedDesc: faker.commerce.productDescription(),
    suggestedKeywords: faker.helpers.arrayElements([
      'promoção', 'melhor preço', 'qualidade', 'original', 'entrega rápida', 
      'garantia', 'exclusivo', 'lançamento', 'edição limitada', 'premium'
    ], faker.number.int({ min: 4, max: 8 })).join(', '),
    reasoning: 'Os novos termos e descrição têm maior potencial de conversão e melhor SEO para a plataforma Shopee.',
    createdAt: faker.date.recent(),
  }));

  // Categorias mais vendidas
  const topCategories = [
    { name: 'Eletrônicos', value: faker.number.int({ min: 25, max: 40 }) },
    { name: 'Moda', value: faker.number.int({ min: 15, max: 35 }) },
    { name: 'Casa', value: faker.number.int({ min: 10, max: 25 }) },
    { name: 'Beleza', value: faker.number.int({ min: 5, max: 20 }) },
    { name: 'Esportes', value: faker.number.int({ min: 5, max: 15 }) }
  ];

  return {
    user,
    stores,
    products,
    notifications,
    metrics,
    optimizations,
    topCategories
  };
};

export default function DemoDashboard() {
  const [demoData, setDemoData] = useState<any>(null);
  
  useEffect(() => {
    // Gerar dados quando componente montar
    setDemoData(generateDemoData());
  }, []);

  // Aguarda dados serem gerados
  if (!demoData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { user, stores, products, notifications, metrics, optimizations, topCategories } = demoData;
  const activeStore = stores[0];

  // Cores para o gráfico
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <DemoSidebarLayout demoData={{ user, stores, notifications }}>
      <div className="px-4 md:px-6 py-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Demonstração - {activeStore.shopName}</h1>
            <p className="text-muted-foreground">
              Essa é uma demonstração completa com dados simulados do CIP Shopee
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">Sincronizar Loja</Button>
            <Button>
              <BadgePlus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">
                  R$ {activeStore.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +15% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Package className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">
                  {activeStore.totalProducts}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {products.filter(p => p.isOptimized).length} produtos otimizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas Mensais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingBag className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">
                  {activeStore.monthlySales}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxa de conversão de {activeStore.averageCtr.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Visualizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">
                  {activeStore.totalViews.toLocaleString('pt-BR')}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{faker.number.int({ min: 5, max: 25 })}% em relação à semana anterior
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
              <CardDescription>
                Análise de desempenho da sua loja na última semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8884d8" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categorias Mais Vendidas</CardTitle>
              <CardDescription>
                Distribuição de vendas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCategories}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {topCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Produtos Populares</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 6).map((product) => (
              <Card key={product.id}>
                <CardContent className="p-0">
                  <div className="aspect-square w-full overflow-hidden rounded-t-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-lg">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.stock} em estoque
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                      <span>{product.sales} vendas</span>
                      <span>{product.views} visualizações</span>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full">
                        {product.isOptimized ? 'Ver Otimizações' : 'Otimizar Produto'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Otimizações Recentes</CardTitle>
              <CardDescription>
                Melhorias sugeridas pela IA para seus produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizations.slice(0, 3).map((opt) => (
                  <div key={opt.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">
                        Produto: {products.find(p => p.id === opt.productId)?.name || opt.originalTitle}
                      </h3>
                      <span 
                        className={`rounded-full px-2 py-1 text-xs ${
                          opt.status === 'applied' ? 'bg-green-100 text-green-800' : 
                          opt.status === 'ignored' ? 'bg-red-100 text-red-800' :
                          opt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {opt.status === 'applied' ? 'Aplicado' : 
                         opt.status === 'ignored' ? 'Ignorado' :
                         opt.status === 'completed' ? 'Concluído' : 'Pendente'}
                      </span>
                    </div>
                    
                    <Tabs defaultValue="title" className="mt-2">
                      <TabsList>
                        <TabsTrigger value="title">Título</TabsTrigger>
                        <TabsTrigger value="description">Descrição</TabsTrigger>
                        <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
                      </TabsList>
                      <TabsContent value="title" className="pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <div className="text-sm font-semibold mb-1">Original:</div>
                            <div className="border rounded p-2 text-sm">{opt.originalTitle}</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold mb-1">Sugerido:</div>
                            <div className="border rounded p-2 text-sm bg-yellow-50">{opt.suggestedTitle}</div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="description" className="pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <div className="text-sm font-semibold mb-1">Original:</div>
                            <div className="border rounded p-2 text-sm">{opt.originalDesc}</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold mb-1">Sugerido:</div>
                            <div className="border rounded p-2 text-sm bg-yellow-50">{opt.suggestedDesc}</div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="keywords" className="pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <div className="text-sm font-semibold mb-1">Original:</div>
                            <div className="border rounded p-2 text-sm">{opt.originalKeywords}</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold mb-1">Sugerido:</div>
                            <div className="border rounded p-2 text-sm bg-yellow-50">{opt.suggestedKeywords}</div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Motivo: </span>
                        {opt.reasoning}
                      </p>
                    </div>
                    
                    {opt.status === 'completed' && (
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="default">Aplicar</Button>
                        <Button size="sm" variant="outline">Ignorar</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-6 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Demonstração do CIP Shopee</h2>
            <p className="mb-4 text-muted-foreground">
              Você está visualizando uma demonstração com dados fictícios.
              Para uma experiência completa com seus dados reais, faça login na sua conta.
            </p>
            <Button asChild>
              <a href="/">Voltar para Página Inicial</a>
            </Button>
          </div>
        </div>
      </div>
    </DemoSidebarLayout>
  );
}