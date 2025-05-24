import { useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCTR, formatCurrency } from "@/lib/utils/formatters";
import { Product } from "@/lib/types";
import { EMPTY_STATES } from "@/lib/constants";
import { Security } from '@/utils/security';

interface ProductListProps {
  products: Product[];
  showOptimizeButton?: boolean;
}

export default function ProductList({ products, showOptimizeButton = false }: ProductListProps) {
  // Get first image for each product or use fallback
  const getProductImage = (product: Product) => {
    return product.images && product.images.length > 0 
      ? product.images[0] 
      : null;
  };

  // Get CTR badge color based on value
  const getCtrBadgeVariant = (ctr: number | undefined) => {
    if (!ctr) return "outline";
    if (ctr >= 4) return "success";
    if (ctr >= 2) return "warning";
    return "destructive";
  };

  if (!products || products.length === 0) {
    return (
      <div className="py-8 text-center">
        <i className={`${EMPTY_STATES.products.icon} text-3xl text-muted-foreground mb-2`}></i>
        <p className="text-muted-foreground">{EMPTY_STATES.products.title}</p>
        <p className="text-sm text-muted-foreground mt-1">{EMPTY_STATES.products.description}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {products.map((product) => {
        const safeProduct = Security.sanitizeProductData(product);
        return (
        <li key={safeProduct.id} className="flex items-center p-2 rounded-md hover:bg-accent/50 transition-colors">
          <Avatar className="h-12 w-12 rounded-md mr-4 border border-border">
            {getProductImage(safeProduct) ? (
              <AvatarImage src={getProductImage(safeProduct)!} alt={safeProduct.name} className="object-cover" />
            ) : (
              <AvatarFallback className="rounded-md bg-muted">
                <i className="ri-image-line text-muted-foreground"></i>
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/product/${safeProduct.id}`}>
              <a className="text-sm font-medium hover:underline line-clamp-1">{safeProduct.name}</a>
            </Link>
            <div className="flex items-center mt-1">
              <Badge variant={getCtrBadgeVariant(safeProduct.ctr)} className="mr-2 text-xs">
                CTR {formatCTR(safeProduct.ctr)}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatCurrency(safeProduct.price)}</span>
            </div>
          </div>

          <Link href={`/dashboard/product/${safeProduct.id}`}>
            <Button variant="ghost" size="icon" className="ml-2">
              <i className="ri-arrow-right-s-line text-xl"></i>
            </Button>
          </Link>

          {showOptimizeButton && (
            <Link href={`/dashboard/optimize/${safeProduct.id}`}>
              <Button variant="default" size="sm" className="ml-2">
                Otimizar
              </Button>
            </Link>
          )}
        </li>
      )})}
    </ul>
  );
}