import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCTR, formatCurrency, formatDate } from "@/lib/utils/formatters";
import { getStatusIcon, getStatusColorClass } from "@/lib/utils/icons";
import { Product } from "@/lib/types";
import { EMPTY_STATES } from "@/lib/constants";
import { Helmet } from "react-helmet";

export default function Products() {
  const [activeStore, setActiveStore] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch user's stores
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['/api/stores'],
    queryFn: async () => {
      const response = await fetch('/api/stores', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stores');
      return response.json();
    }
  });

  // Set active store when stores are loaded
  if (stores?.length > 0 && !activeStore) {
    setActiveStore(stores[0].id);
  }

  // Fetch products for active store
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products', activeStore],
    queryFn: async () => {
      if (!activeStore) return [];

      const response = await fetch(`/api/products?storeId=${activeStore}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!activeStore,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Filter products by search term
  const filteredProducts = products ? products.filter((product: Product) => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  // Sort products
  const sortedProducts = filteredProducts ? [...filteredProducts].sort((a: Product, b: Product) => {
    // Helper for null/undefined values
    const compareValues = (valA: any, valB: any) => {
      if (valA === null || valA === undefined) return sortDirection === "asc" ? -1 : 1;
      if (valB === null || valB === undefined) return sortDirection === "asc" ? 1 : -1;
      return sortDirection === "asc" ? valA - valB : valB - valA;
    };

    switch (sortOption) {
      case "name":
        return sortDirection === "asc" 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      case "price":
        return sortDirection === "asc" ? a.price - b.price : b.price - a.price;
      case "ctr":
        return compareValues(a.ctr, b.ctr);
      case "views":
        return compareValues(a.views, b.views);
      case "sales":
        return compareValues(a.sales, b.sales);
      case "updatedAt":
      default:
        return sortDirection === "asc" 
          ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  }) : [];

  // Toggle sort direction
  const toggleSort = (column: string) => {
    if (sortOption === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortOption(column);
      setSortDirection("desc");
    }
  };

  // Get product image or fallback
  const getProductImage = (product: Product) => {
    return product.images && product.images.length > 0 
      ? product.images[0] 
      : null;
  };

  // Get CTR badge variant
  const getCtrBadgeVariant = (ctr: number | undefined) => {
    if (!ctr) return "outline";
    if (ctr >= 4) return "success";
    if (ctr >= 2) return "warning";
    return "destructive";
  };

  return (
    <SidebarLayout title="Produtos">
      <Helmet>
        <title>Produtos | CIP Shopee</title>
      </Helmet>

      <div className="flex flex-col gap-6">
        {/* Store selector if multiple stores */}
        {stores?.length > 1 && (
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
        )}

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <i className="ri-filter-3-line mr-2"></i>
                Ordenar por
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleSort("name")}>
                Nome {sortOption === "name" && <i className={`ml-2 ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`}></i>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("price")}>
                Preço {sortOption === "price" && <i className={`ml-2 ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`}></i>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("ctr")}>
                CTR {sortOption === "ctr" && <i className={`ml-2 ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`}></i>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("views")}>
                Visualizações {sortOption === "views" && <i className={`ml-2 ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`}></i>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("sales")}>
                Vendas {sortOption === "sales" && <i className={`ml-2 ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`}></i>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("updatedAt")}>
                Atualização {sortOption === "updatedAt" && <i className={`ml-2 ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`}></i>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Products table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center">
              <span>Produtos</span>
              <Badge variant="outline">
                {!productsLoading && sortedProducts 
                  ? `${sortedProducts.length} produtos`
                  : 'Carregando...'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !activeStore ? (
              // No store selected
              <div className="py-12 text-center">
                <i className={`${EMPTY_STATES.stores.icon} text-4xl text-muted-foreground mb-3`}></i>
                <p className="text-lg font-medium">{EMPTY_STATES.stores.title}</p>
                <p className="text-muted-foreground mt-1">{EMPTY_STATES.stores.description}</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/store/connect">Conectar Loja</Link>
                </Button>
              </div>
            ) : sortedProducts.length === 0 ? (
              // No products found
              <div className="py-12 text-center">
                {searchTerm ? (
                  <>
                    <i className="ri-file-search-line text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                    <p className="text-muted-foreground mt-1">
                      Não encontramos produtos correspondentes a "{searchTerm}"
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchTerm("")}
                    >
                      Limpar busca
                    </Button>
                  </>
                ) : (
                  <>
                    <i className={`${EMPTY_STATES.products.icon} text-4xl text-muted-foreground mb-3`}></i>
                    <p className="text-lg font-medium">{EMPTY_STATES.products.title}</p>
                    <p className="text-muted-foreground mt-1">{EMPTY_STATES.products.description}</p>
                  </>
                )}
              </div>
            ) : (
              // Products table - Mobile responsive layout
              <div className="space-y-4 md:space-y-0">
                {/* Mobile Cards Layout */}
                <div className="block md:hidden space-y-3">
                  {sortedProducts.map((product: Product) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 rounded-md flex-shrink-0">
                          {getProductImage(product) ? (
                            <AvatarImage 
                              src={getProductImage(product)!} 
                              alt={product.name} 
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback className="rounded-md bg-muted">
                              <i className="ri-shopping-bag-line text-muted-foreground"></i>
                            </AvatarFallback>
                          )}
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <Link href={`/dashboard/product/${product.id}`}>
                                <a className="font-medium hover:underline line-clamp-2 text-sm">
                                  {product.name}
                                </a>
                              </Link>
                              <div className="text-xs text-muted-foreground mt-1">
                                ID: {product.productId.substring(0, 10)}...
                              </div>
                            </div>
                            
                            <div className="flex gap-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <Link href={`/dashboard/product/${product.id}`}>
                                  <i className="ri-eye-line text-sm"></i>
                                </Link>
                              </Button>
                              <Button 
                                variant="default" 
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <Link href={`/dashboard/optimize/${product.id}`}>
                                  <i className="ri-ai-generate text-sm"></i>
                                </Link>
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Status:</span>
                              <Badge variant={product.status === 'active' ? 'success' : 'secondary'} className="text-xs">
                                <i className={`${getStatusIcon(product.status)} mr-1`}></i>
                                {product.status === 'active' ? 'Ativo' : product.status === 'inactive' ? 'Inativo' : 'Excluído'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">CTR:</span>
                              <Badge variant={getCtrBadgeVariant(product.ctr)} className="text-xs">
                                {formatCTR(product.ctr)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2 text-sm">
                            <span className="font-medium">{formatCurrency(product.price)}</span>
                            <span className="text-muted-foreground">Estoque: {product.stock}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead className="text-center">CTR</TableHead>
                        <TableHead className="text-center">Views</TableHead>
                        <TableHead className="text-center">Vendas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedProducts.map((product: Product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Avatar className="h-10 w-10 rounded-md">
                              {getProductImage(product) ? (
                                <AvatarImage 
                                  src={getProductImage(product)!} 
                                  alt={product.name} 
                                  className="object-cover"
                                />
                              ) : (
                                <AvatarFallback className="rounded-md bg-muted">
                                  <i className="ri-shopping-bag-line text-muted-foreground"></i>
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Link href={`/dashboard/product/${product.id}`}>
                                <a className="font-medium hover:underline line-clamp-1 max-w-xs">
                                  {product.name}
                                </a>
                              </Link>
                              <div className="text-xs text-muted-foreground">
                                ID: {product.productId.substring(0, 10)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>
                              <i className={`${getStatusIcon(product.status)} mr-1`}></i>
                              {product.status === 'active' ? 'Ativo' : product.status === 'inactive' ? 'Inativo' : 'Excluído'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getCtrBadgeVariant(product.ctr)}>
                              {formatCTR(product.ctr)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {product.views ? formatCurrency(product.views).replace('R$', '') : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.sales ? formatCurrency(product.sales).replace('R$', '') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                asChild
                              >
                                <Link href={`/dashboard/product/${product.id}`}>
                                  <i className="ri-eye-line"></i>
                                </Link>
                              </Button>
                              <Button 
                                variant="default" 
                                size="icon"
                                asChild
                              >
                                <Link href={`/dashboard/optimize/${product.id}`}>
                                  <i className="ri-ai-generate"></i>
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}