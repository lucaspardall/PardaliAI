import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils/formatters";
import { ShopeeStore } from "@/lib/types";

interface StoreDetailsProps {
  store: ShopeeStore;
}

export default function StoreDetails({ store }: StoreDetailsProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Toggle store active status
  const toggleStoreMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/stores/${store.id}`, {
        isActive: !store.isActive
      });
    },
    onSuccess: () => {
      toast({
        title: store.isActive ? "Loja desativada" : "Loja ativada",
        description: store.isActive 
          ? "A sincronização de produtos para esta loja foi pausada." 
          : "A loja foi reativada e os produtos serão sincronizados.",
        variant: "success",
      });
      
      // Invalidate stores query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar status da loja",
        description: error.message || "Ocorreu um erro ao alterar o status da loja.",
        variant: "destructive",
      });
    },
  });

  // Delete store
  const deleteStoreMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/stores/${store.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Loja removida",
        description: "A loja foi desconectada com sucesso.",
        variant: "success",
      });
      
      // Invalidate stores query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover loja",
        description: error.message || "Ocorreu um erro ao remover a loja.",
        variant: "destructive",
      });
    },
  });

  // Sync store products
  const syncStoreMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/stores/${store.id}`, {
        lastSyncAt: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast({
        title: "Sincronização iniciada",
        description: "Os produtos da loja estão sendo sincronizados.",
        variant: "success",
      });
      
      // Invalidate stores and products queries
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: [`/api/stores/${store.id}/products`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao sincronizar produtos",
        description: error.message || "Ocorreu um erro ao sincronizar os produtos da loja.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center">
                {store.shopName}
                <Badge 
                  variant={store.isActive ? "success" : "secondary"} 
                  className="ml-2"
                >
                  {store.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">ID: {store.shopId}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <i className="ri-more-2-fill"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => syncStoreMutation.mutate()} disabled={!store.isActive}>
                  <i className="ri-refresh-line mr-2"></i>
                  Sincronizar produtos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleStoreMutation.mutate()}>
                  <i className={`${store.isActive ? 'ri-stop-line' : 'ri-play-line'} mr-2`}></i>
                  {store.isActive ? "Desativar loja" : "Ativar loja"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  Remover loja
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total de produtos</p>
              <p className="font-medium">{store.totalProducts}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Região</p>
              <p className="font-medium">{store.shopRegion}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Última sincronização</p>
              <p className="font-medium">
                {store.lastSyncAt ? formatDate(store.lastSyncAt) : "Nunca"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Conectado em</p>
              <p className="font-medium">{formatDate(store.createdAt)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => syncStoreMutation.mutate()}
            disabled={syncStoreMutation.isPending || !store.isActive}
          >
            {syncStoreMutation.isPending ? (
              <>
                <i className="ri-loader-2-line animate-spin mr-2"></i>
                Sincronizando...
              </>
            ) : (
              <>
                <i className="ri-refresh-line mr-2"></i>
                Sincronizar produtos
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover loja</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a loja "{store.shopName}"?
              Esta ação não pode ser desfeita e todos os dados relacionados serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStoreMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStoreMutation.isPending ? (
                <>
                  <i className="ri-loader-2-line animate-spin mr-2"></i>
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
