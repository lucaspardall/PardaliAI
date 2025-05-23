import React, { useState } from 'react';
import DemoSidebarLayout from '@/components/layout/DemoSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Filter, Search, Sliders, XCircle } from 'lucide-react';
import { generateDemoData } from '../../../lib/demo-data';

export default function DemoProducts() {
  // Gerar dados de demonstração
  const demoData = generateDemoData();
  const { user, stores, notifications } = demoData;
  
  // Estado para controle de produtos filtrados
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStore, setActiveStore] = useState(stores[0]);
  
  // Gerar produtos para a loja ativa
  const products = Array(15).fill(null).map((_, index) => ({
    id: index + 1,
    name: faker.commerce.productName(),
    storeId: activeStore.id,
    productId: faker.string.alphanumeric(10),
    category: faker.commerce.department(),
    price: faker.number.float({ min: 19.9, max: 299.9, precision: 0.01 }),
    stock: faker.number.int({ min: 0, max: 100 }),
    sales: faker.number.int({ min: 0, max: 50 }),
    revenue: faker.number.float({ min: 0, max: 2000, precision: 0.01 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    lastSyncAt: faker.date.recent(),
    imageUrl: faker.image.urlLoremFlickr({ category: 'product' }),
    status: faker.helpers.arrayElement(['active', 'inactive', 'out_of_stock']),
    rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
    views: faker.number.int({ min: 10, max: 1000 }),
    conversionRate: faker.number.float({ min: 0.5, max: 8, precision: 0.1 }),
    optimized: faker.datatype.boolean(),
  }));
  
  // Filtrar produtos com base na pesquisa
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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

  return (
    <DemoSidebarLayout demoData={{ user, stores, notifications }}>
      <div className="px-4 md:px-6 py-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Produtos - {activeStore.shopName}</h1>
            <p className="text-muted-foreground">
              Gerencie os produtos da sua loja Shopee
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Sliders className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Link href="/demo/dashboard">
              <Button>
                <Filter className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Produtos da Loja</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos por nome ou categoria..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button>
                Adicionar Produto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Otimizado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{product.sales}</TableCell>
                      <TableCell>{renderStatus(product.status)}</TableCell>
                      <TableCell>
                        {product.optimized ? (
                          <Badge variant="outline" className="bg-primary-50 text-primary border-primary-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Não
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/demo/product/${product.id}`}>
                            <Button variant="outline" size="sm">
                              Detalhes
                            </Button>
                          </Link>
                          {!product.optimized && (
                            <Link href={`/demo/optimize/${product.id}`}>
                              <Button size="sm">
                                Otimizar
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DemoSidebarLayout>
  );
}