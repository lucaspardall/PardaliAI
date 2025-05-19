import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCTR, formatCurrency } from "@/lib/utils/formatters";
import { Product } from "@/lib/types";

interface OptimizationItemProps {
  product: Product;
}

export default function OptimizationItem({ product }: OptimizationItemProps) {
  // Get first image or use fallback
  const productImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : null;

  // Get badge color based on CTR
  const getBadgeVariant = (ctr: number | undefined) => {
    if (!ctr) return "outline";
    if (ctr >= 4) return "success";
    if (ctr >= 2) return "warning";
    return "destructive";
  };

  return (
    <div className="flex items-center p-2 rounded-md hover:bg-accent/50 transition-colors">
      <div className="relative">
        <Avatar className="h-12 w-12 rounded-md border border-border">
          {productImage ? (
            <AvatarImage src={productImage} alt={product.name} className="object-cover" />
          ) : (
            <AvatarFallback className="rounded-md bg-muted">
              <i className="ri-image-line text-muted-foreground"></i>
            </AvatarFallback>
          )}
        </Avatar>
        <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-xs">
          <i className="ri-alert-line"></i>
        </span>
      </div>
      
      <div className="ml-4 flex-1 min-w-0">
        <Link href={`/dashboard/product/${product.id}`}>
          <a className="text-sm font-medium hover:underline line-clamp-1">{product.name}</a>
        </Link>
        <div className="flex items-center mt-1">
          <Badge variant={getBadgeVariant(product.ctr)} className="mr-2 text-xs">
            CTR {formatCTR(product.ctr)}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatCurrency(product.price)}</span>
        </div>
      </div>
      
      <Link href={`/dashboard/optimize/${product.id}`}>
        <Button size="sm" className="ml-2">
          Otimizar
        </Button>
      </Link>
    </div>
  );
}
