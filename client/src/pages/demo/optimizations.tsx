import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { TrendingUp, ArrowUpRight, BarChart2, Search, CheckCircle } from 'lucide-react';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function DemoOptimizations() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [demoUser, setDemoUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [optimizations, setOptimizations] = useState<any[]>([]);
  
  // Verificar autenticação e carregar dados do localStorage
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('demo_logged_in');
      const userData = localStorage.getItem('demo_user');
      
      if (isLoggedIn === 'true' && userData) {
        try {
          // Carregar usuário do localStorage
          const user = JSON.parse(userData);
          setDemoUser(user);
          
          // Dados simulados de otimizações
          const demoOptimizations = [
            {
              id: 1,
              productId: 'SP12345678',
              productName: 'Smartphone Galaxy X30 128GB',
              originalTitle: 'Smartphone Galaxy X30 128GB Preto',
              suggestedTitle: 'Smartphone Samsung Galaxy X30 128GB 6GB RAM Tela AMOLED Preto',
              originalKeywords: ['smartphone', 'galaxy', 'celular'],
              suggestedKeywords: ['smartphone samsung', 'galaxy x30', 'celular android', 'tela amoled', '128gb', '6gb ram'],
              status: 'completed',
              improvement: 35,
              createdAt: new Date(Date.now() - 48 * 3600 * 1000),
              storeId: 1,
              appliedAt: null
            },
            {
              id: 2,
              productId: 'SP87654321',
              productName: 'Fone de Ouvido Bluetooth',
              originalTitle: 'Fone de Ouvido Bluetooth Branco',
              suggestedTitle: 'Fone de Ouvido Sem Fio Bluetooth 5.0 com Cancelamento de Ruído - Branco',
              originalKeywords: ['fone', 'bluetooth', 'áudio'],
              suggestedKeywords: ['fone sem fio', 'bluetooth 5.0', 'cancelamento de ruído', 'fone de ouvido wireless', 'headphone bluetooth'],
              status: 'completed',
              improvement: 42,
              createdAt: new Date(Date.now() - 24 * 3600 * 1000),
              storeId: 1,
              appliedAt: new Date(Date.now() - 12 * 3600 * 1000)
            },
            {
              id: 3,
              productId: 'SP55443322',
              productName: 'Smartwatch Fitness Pro',
              originalTitle: 'Smartwatch Preto Fitness',
              suggestedTitle: 'Smartwatch Fitness Pro Monitor Cardíaco GPS Prova D\'água - Preto',
              originalKeywords: ['relógio', 'smartwatch', 'fitness'],
              suggestedKeywords: ['smartwatch fitness', 'monitor cardíaco', 'relógio inteligente', 'gps integrado', 'prova d\'água', 'esportes'],
              status: 'completed',
              improvement: 28,
              createdAt: new Date(Date.now() - 72 * 3600 * 1000),
              storeId: 1,
              appliedAt: null
            },
            {
              id: 4,
              productId: 'SP11223344',
              productName: 'Câmera Action Pro 4K',
              originalTitle: 'Câmera Action Pro 4K À Prova D\'água',
              suggestedTitle: 'Câmera Action Pro 4K Ultra HD WiFi À Prova D\'água 30m com Estabilização',
              originalKeywords: ['câmera', '4k', 'prova d\'água'],
              suggestedKeywords: ['câmera action', '4k ultra hd', 'prova d\'água 30m', 'estabilização de imagem', 'wifi', 'esportes radicais'],
              status: 'in_progress',
              improvement: null,
              createdAt: new Date(Date.now() - 2 * 3600 * 1000),
              storeId: 1,
              appliedAt: null
            }
          ];
          
          setOptimizations(demoOptimizations);
          setIsLoading(false);
        } catch (error) {
          console.error('Erro ao carregar dados demo:', error);
          navigate('/demo/login');
        }
      } else {
        navigate('/demo/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Função para filtrar otimizações pelo termo de busca
  const filteredOptimizations = optimizations.filter(opt => 
    opt.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.productId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Otimizações filtradas por status
  const completedOptimizations = filteredOptimizations.filter(opt => opt.status === 'completed');
  const pendingOptimizations = filteredOptimizations.filter(opt => opt.status === 'in_progress');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-500">Em Progresso</Badge>;
      default:
        return <Badge className="bg-slate-500">Pendente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Carregando otimizações...</h2>
          <p className="text-muted-foreground">Preparando dados de demonstração</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout
      user={demoUser}
      stores={[]}
      notifications={[]}
      demoMode={true}
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Otimizações de Produtos</h1>
            <p className="text-muted-foreground mt-1">
              Otimize seus produtos com sugestões de IA para aumentar a visibilidade e as vendas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/demo/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/demo/products')}>
              <Search className="mr-2 h-4 w-4" />
              Ver Produtos
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Buscar por nome ou ID do produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Total de Otimizações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{optimizations.length}</div>
              <p className="text-muted-foreground text-sm">Produtos otimizados até agora</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Otimizações Aplicadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {optimizations.filter(opt => opt.appliedAt).length}
              </div>
              <p className="text-muted-foreground text-sm">Melhorias implementadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Melhoria Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(completedOptimizations.reduce((acc, curr) => acc + (curr.improvement || 0), 0) / 
                  (completedOptimizations.length || 1))}%
              </div>
              <p className="text-muted-foreground text-sm">Aumento estimado de visibilidade</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todas ({filteredOptimizations.length})</TabsTrigger>
            <TabsTrigger value="completed">Concluídas ({completedOptimizations.length})</TabsTrigger>
            <TabsTrigger value="pending">Em Progresso ({pendingOptimizations.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {filteredOptimizations.length > 0 ? (
              filteredOptimizations.map((opt) => (
                <OptimizationCard key={opt.id} optimization={opt} getStatusBadge={getStatusBadge} />
              ))
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma otimização encontrada</h3>
                <p className="text-muted-foreground">Tente ajustar os filtros ou buscar por outros termos.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedOptimizations.length > 0 ? (
              completedOptimizations.map((opt) => (
                <OptimizationCard key={opt.id} optimization={opt} getStatusBadge={getStatusBadge} />
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma otimização concluída</h3>
                <p className="text-muted-foreground">As otimizações em andamento aparecerão aqui quando concluídas.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            {pendingOptimizations.length > 0 ? (
              pendingOptimizations.map((opt) => (
                <OptimizationCard key={opt.id} optimization={opt} getStatusBadge={getStatusBadge} />
              ))
            ) : (
              <div className="text-center py-12">
                <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma otimização em andamento</h3>
                <p className="text-muted-foreground">Todas as otimizações solicitadas foram concluídas.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}

// Componente de cartão de otimização
function OptimizationCard({ optimization, getStatusBadge }: { optimization: any, getStatusBadge: (status: string) => React.ReactNode }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/10 pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{optimization.productName}</CardTitle>
            <CardDescription>ID: {optimization.productId}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(optimization.status)}
            <Badge variant="outline" className="whitespace-nowrap">
              {optimization.status === 'completed' ? `+${optimization.improvement}% melhoria` : 'Em análise'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {optimization.status === 'in_progress' ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Progresso da otimização</p>
              <div className="flex items-center gap-2">
                <Progress value={65} className="h-2" />
                <span className="text-sm">65%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">A IA está analisando seu produto para gerar sugestões de otimização. Este processo pode levar alguns minutos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Título Original</p>
                <p className="text-sm text-muted-foreground mt-1">{optimization.originalTitle}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Título Sugerido</p>
                <p className="text-sm font-medium text-green-600 mt-1">{optimization.suggestedTitle}</p>
              </div>
            </div>
            
            {showDetails && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Palavras-chave Originais</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {optimization.originalKeywords.map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="outline">{keyword}</Badge>
                  ))}
                </div>
                
                <p className="text-sm font-medium mb-2">Palavras-chave Sugeridas</p>
                <div className="flex flex-wrap gap-1">
                  {optimization.suggestedKeywords.map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{keyword}</Badge>
                  ))}
                </div>
                
                <div className="mt-4">
                  <p className="text-sm font-medium">Criado em</p>
                  <p className="text-sm text-muted-foreground">
                    {optimization.createdAt.toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                {optimization.appliedAt && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Aplicado em</p>
                    <p className="text-sm text-muted-foreground">
                      {optimization.appliedAt.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between bg-muted/10 pt-2">
        <Button variant="ghost" size="sm" onClick={() => setShowDetails(prev => !prev)}>
          {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
        </Button>
        
        {optimization.status === 'completed' && !optimization.appliedAt && (
          <Button size="sm">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Aplicar Sugestões
          </Button>
        )}
        
        {optimization.status === 'completed' && optimization.appliedAt && (
          <Badge variant="outline" className="ml-auto">Aplicado</Badge>
        )}
      </CardFooter>
    </Card>
  );
}