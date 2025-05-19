import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import StoreDetails from "./StoreDetails";

interface ConnectStoreProps {
  onSuccess?: () => void;
}

export default function ConnectStore({ onSuccess }: ConnectStoreProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [shopCredentials, setShopCredentials] = useState({
    shopName: "",
    shopId: "",
    accessToken: "",
    refreshToken: "",
  });
  const queryClient = useQueryClient();

  // Fetch user's stores
  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ["/api/stores"],
  });

  // Check if user has reached store limit
  const hasReachedStoreLimit = user && stores && stores.length >= user.storeLimit;

  // Handle store connection mutation
  const connectStoreMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/stores", data);
    },
    onSuccess: async () => {
      toast({
        title: "Loja conectada com sucesso!",
        description: "Sua loja Shopee foi conectada e seus produtos serão sincronizados em breve.",
        variant: "success",
      });
      
      // Reset form
      setShopCredentials({
        shopName: "",
        shopId: "",
        accessToken: "",
        refreshToken: "",
      });
      
      // Invalidate stores query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao conectar loja",
        description: error.message || "Ocorreu um erro ao conectar sua loja Shopee. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handle real OAuth connection with Shopee
  const handleConnectOAuth = () => {
    try {
      setIsConnecting(true);
      // Exibir indicador de carregamento antes do redirecionamento
      toast({
        title: "Iniciando conexão",
        description: "Você será redirecionado para autorização da Shopee em instantes...",
        variant: "default",
      });
      
      // Atraso pequeno para garantir que o toast seja exibido antes do redirecionamento
      setTimeout(() => {
        // Redirecionar para o endpoint de autorização da Shopee
        window.location.href = '/api/shopee/authorize';
      }, 1000);
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Erro ao iniciar conexão",
        description: "Não foi possível iniciar o processo de conexão com a Shopee.",
        variant: "destructive",
      });
    }
  };
  
  // Função para simular conexão OAuth (para ambiente de desenvolvimento)
  const handleSimulateOAuth = () => {
    setIsConnecting(true);
    
    // Simular fluxo OAuth com timeout
    setTimeout(() => {
      // Gerar ID de loja aleatório
      const randomShopId = `shop_${Math.floor(Math.random() * 1000000)}`;
      
      // Criar loja de demonstração
      connectStoreMutation.mutate({
        shopName: "Minha Loja Shopee (Demo)",
        shopId: randomShopId,
        shopRegion: "BR",
        accessToken: `demo_access_token_${randomShopId}`,
        refreshToken: `demo_refresh_token_${randomShopId}`,
        tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias a partir de agora
        isActive: true
      });
      
      setIsConnecting(false);
    }, 2000);
  };

  // Handle manual connection form submission
  const handleManualConnect = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!shopCredentials.shopName || !shopCredentials.shopId || !shopCredentials.accessToken || !shopCredentials.refreshToken) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para conectar sua loja.",
        variant: "destructive",
      });
      return;
    }
    
    // Connect store with form data
    connectStoreMutation.mutate({
      ...shopCredentials,
      shopRegion: "BR",
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    });
  };

  // If stores are loading, show loading state
  if (storesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando informações da loja...</CardTitle>
          <CardDescription>Por favor, aguarde enquanto buscamos os dados da sua loja.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // If user already has stores, show them
  if (stores && stores.length > 0) {
    return (
      <div className="space-y-6">
        {/* Existing stores */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Lojas Conectadas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {stores.map((store: any) => (
              <StoreDetails key={store.id} store={store} />
            ))}
          </div>
        </div>
        
        {/* Add more stores if limit not reached */}
        {!hasReachedStoreLimit && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Conectar Nova Loja</h2>
            <Card>
              <CardHeader>
                <CardTitle>Adicionar outra loja Shopee</CardTitle>
                <CardDescription>
                  Conecte mais uma loja Shopee para gerenciar e otimizar produtos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleConnectOAuth} 
                  disabled={isConnecting || connectStoreMutation.isPending}
                  className="w-full"
                >
                  {(isConnecting || connectStoreMutation.isPending) ? (
                    <>
                      <i className="ri-loader-2-line animate-spin mr-2"></i>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <i className="ri-shopping-bag-line mr-2"></i>
                      Conectar com Shopee
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Plan upgrade suggestion if limit reached */}
        {hasReachedStoreLimit && user?.plan !== 'enterprise' && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="text-lg font-medium">Limite de lojas atingido</h3>
                  <p className="text-muted-foreground">
                    Seu plano atual permite até {user?.storeLimit} {user?.storeLimit === 1 ? 'loja' : 'lojas'}.
                    Faça upgrade para conectar mais lojas.
                  </p>
                </div>
                <Button variant="default" asChild>
                  <a href="/dashboard/subscription">Fazer upgrade</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Default: show connect store UI
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conecte sua loja Shopee</CardTitle>
        <CardDescription>
          Para começar a otimizar seus produtos, conecte sua loja Shopee ao CIP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-md flex items-start">
          <i className="ri-information-line text-blue-500 mt-0.5 mr-3 text-lg"></i>
          <div>
            <p className="text-sm">
              Para este MVP, você pode conectar uma loja de demonstração instantaneamente sem precisar de credenciais reais da Shopee.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleConnectOAuth} 
            disabled={isConnecting || connectStoreMutation.isPending}
            className="w-full"
          >
            {(isConnecting || connectStoreMutation.isPending) ? (
              <>
                <i className="ri-loader-2-line animate-spin mr-2"></i>
                Conectando...
              </>
            ) : (
              <>
                <i className="ri-link mr-2"></i>
                Conectar com Shopee
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleSimulateOAuth} 
            disabled={isConnecting || connectStoreMutation.isPending}
            className="w-full"
            variant="outline"
          >
            {(isConnecting || connectStoreMutation.isPending) ? (
              <>
                <i className="ri-loader-2-line animate-spin mr-2"></i>
                Simulando conexão...
              </>
            ) : (
              <>
                <i className="ri-test-tube-line mr-2"></i>
                Simular conexão (para desenvolvimento)
              </>
            )}
          </Button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou conecte manualmente</span>
          </div>
        </div>
        
        <form onSubmit={handleManualConnect} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shopName">Nome da Loja</Label>
              <Input
                id="shopName"
                placeholder="Minha Loja Shopee"
                value={shopCredentials.shopName}
                onChange={(e) => setShopCredentials({ ...shopCredentials, shopName: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="shopId">ID da Loja</Label>
              <Input
                id="shopId"
                placeholder="shop_123456"
                value={shopCredentials.shopId}
                onChange={(e) => setShopCredentials({ ...shopCredentials, shopId: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="accessToken">Token de Acesso</Label>
              <Input
                id="accessToken"
                placeholder="access_token_xxx"
                value={shopCredentials.accessToken}
                onChange={(e) => setShopCredentials({ ...shopCredentials, accessToken: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="refreshToken">Token de Atualização</Label>
              <Input
                id="refreshToken"
                placeholder="refresh_token_xxx"
                value={shopCredentials.refreshToken}
                onChange={(e) => setShopCredentials({ ...shopCredentials, refreshToken: e.target.value })}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={connectStoreMutation.isPending}
          >
            {connectStoreMutation.isPending ? (
              <>
                <i className="ri-loader-2-line animate-spin mr-2"></i>
                Conectando...
              </>
            ) : (
              'Conectar Manualmente'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start pt-0">
        <p className="text-xs text-muted-foreground">
          Ao conectar sua loja, você concede permissão para que o CIP Shopee acesse e modifique seus produtos.
          Suas credenciais são armazenadas de forma segura.
        </p>
      </CardFooter>
    </Card>
  );
}
