
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercentage } from "@/lib/utils/formatters";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  ctr?: number;
  views?: number;
  sales?: number;
  status: string;
}

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  if (!products || products.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Nenhum produto encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div key={product.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
          <div className="h-12 w-12 rounded-md bg-muted flex-shrink-0 overflow-hidden">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">IMG</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{product.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm font-medium text-primary">
                {formatCurrency(product.price)}
              </span>
              {product.ctr !== null && product.ctr !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  CTR: {formatPercentage(product.ctr)}
                </Badge>
              )}
              <Badge variant={product.status === 'NORMAL' ? 'default' : 'destructive'} className="text-xs">
                {product.status === 'NORMAL' ? 'Ativo' : product.status}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {product.ctr !== null && product.ctr !== undefined && (
              <div className="flex items-center text-xs text-muted-foreground">
                {product.ctr >= 2.0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                {product.views || 0} views
              </div>
            )}
            
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/product/${product.id}`}>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
