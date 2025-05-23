import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ShoppingBag, Search, Filter, ArrowUpDown, TrendingUp, Eye, Edit, BarChart2 } from 'lucide-react';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function DemoProducts() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [demoUser, setDemoUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
          
          // Dados simulados de produtos
          const demoProducts = [
            {
              id: 1,
              productId: 'SP12345678',
              name: 'Smartphone Galaxy X30 128GB',
              price: 1299.90,
              stock: 45,
              category: 'Eletrônicos',
              status: 'active',
              sales: 127,
              views: 1856,
              createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000),
              storeId: 1
            },
            {
              id: 2,
              productId: 'SP87654321',
              name: 'Fone de Ouvido Bluetooth',
              price: 149.90,
              stock: 120,
              category: 'Acessórios',
              status: 'active',
              sales: 298,
              views: 3452,
              createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000),
              storeId: 1
            },
            {
              id: 3,
              productId: 'SP55443322',
              name: 'Smartwatch Fitness Pro',
              price: 399.90,
              stock: 32,
              category: 'Eletrônicos',
              status: 'active',
              sales: 67,
              views: 943,
              createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000),
              storeId: 1
            },
            {
              id: 4,
              productId: 'SP11223344',
              name: 'Câmera Action Pro 4K',
              price: 499.90,
              stock: 18,
              category: 'Eletrônicos',
              status: 'active',
              sales: 43,
              views: 782,
              createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000),
              storeId: 1
            },
            {
              id: 5,
              productId: 'SP99887766',
              name: 'Carregador Portátil 10000mAh',
              price: 79.90,
              stock: 215,
              category: 'Acessórios',
              status: 'active',
              sales: 189,
              views: 1234,
              createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
              storeId: 1
            },
            {
              id: 6,
              productId: 'SP44556677',
              name: 'Caixa de Som Bluetooth à Prova D\'água',
              price: 159.90,
              stock: 0,
              category: 'Áudio',
              status: 'out_of_stock',
              sales: 78,
              views: 566,
              createdAt: new Date(Date.now() - 75 * 24 * 3600 * 1000),
              storeId: 1
            },
            {
              id: 7,
              productId: 'SP22113344',
              name: 'Tripé para Câmera e Celular',
              price: 89.90,
              stock: 56,
              category: 'Acessórios',
              status: 'active',
              sales: 112,
              views: 890,
              createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000),
              storeId: 1
            },
            {
              id: 8,
              productId: 'SP33221100',
              name: 'Teclado Gamer RGB',
              price: 179.90,
              stock: 5,
              category: 'Periféricos',
              status: 'low_stock',
              sales: 34,
              views: 478,
              createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000),
              storeId: 1
            }
          ];
          
          setProducts(demoProducts);
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

  // Função para filtrar produtos pelo termo de busca
  const filteredProducts = products.filter(product => {
    // Filtro por texto de pesquisa
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por status
    const matchesStatus = 
      statusFilter === 'all' || 
      product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Função para ordenar produtos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'stock':
        comparison = a.stock - b.stock;
        break;
      case 'sales':
        comparison = a.sales - b.sales;
        break;
      case 'views':
        comparison = a.views - b.views;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Função para alternar a ordem de classificação
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Função para obter o badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-500">Sem Estoque</Badge>;
      case 'low_stock':
        return <Badge className="bg-amber-500">Estoque Baixo</Badge>;
      default:
        return <Badge className="bg-slate-500">Inativo</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Carregando produtos...</h2>
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
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e otimize seus produtos na Shopee
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/demo/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/demo/optimizations')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Otimizações
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  Ativos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('out_of_stock')}>
                  Sem Estoque
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('low_stock')}>
                  Estoque Baixo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm">
              Exportar
            </Button>
            <Button size="sm">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Lista de Produtos</h3>
              <Badge variant="outline">{sortedProducts.length} produtos</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead className="min-w-[250px]">
                      <button 
                        className="flex items-center gap-1" 
                        onClick={() => toggleSort('name')}
                      >
                        Produto
                        {sortBy === 'name' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1" 
                        onClick={() => toggleSort('price')}
                      >
                        Preço
                        {sortBy === 'price' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1" 
                        onClick={() => toggleSort('stock')}
                      >
                        Estoque
                        {sortBy === 'stock' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1" 
                        onClick={() => toggleSort('sales')}
                      >
                        Vendas
                        {sortBy === 'sales' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1" 
                        onClick={() => toggleSort('views')}
                      >
                        Visualizações
                        {sortBy === 'views' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProducts.length > 0 ? (
                    sortedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.productId}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>{product.sales}</TableCell>
                        <TableCell>{product.views}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <BarChart2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6">
                        <div className="flex flex-col items-center">
                          <ShoppingBag className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Nenhum produto encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando {sortedProducts.length} de {products.length} produtos
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled>
                Próximo
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </SidebarLayout>
  );
}