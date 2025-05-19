import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function ShopeeConnectPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Verificar o status da conexão com a Shopee
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['/api/shopee/status'],
    retry: false,
    onError: () => {
      toast({
        title: "Erro ao verificar status",
        description: "Não foi possível verificar o status da conexão com a Shopee",
        variant: "destructive"
      });
    }
  });
  
  // Iniciar o fluxo de conexão com a Shopee
  const handleConnect = () => {
    window.location.href = '/api/shopee/authorize';
  };
  
  // Desconectar uma loja Shopee
  const handleDisconnect = async (storeId: number) => {
    try {
      const response = await fetch(`/api/shopee/disconnect/${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        toast({
          title: "Loja desconectada",
          description: "A loja foi desconectada com sucesso",
          variant: "default"
        });
        refetch();
      } else {
        const data = await response.json();
        toast({
          title: "Erro ao desconectar",
          description: data.message || "Não foi possível desconectar a loja",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao desconectar",
        description: "Ocorreu um erro ao tentar desconectar a loja",
        variant: "destructive"
      });
    }
  };
  
  // Status da URL (parâmetros de consulta)
  const params = new URLSearchParams(window.location.search);
  const connectionStatus = params.get('status');
  
  // Exibir mensagem apropriada baseada no status
  React.useEffect(() => {
    if (connectionStatus) {
      if (connectionStatus === 'connected') {
        toast({
          title: "Conexão realizada",
          description: "Sua loja Shopee foi conectada com sucesso!",
          variant: "default"
        });
      } else if (connectionStatus === 'reconnected') {
        toast({
          title: "Reconexão realizada",
          description: "Sua loja Shopee foi reconectada com sucesso!",
          variant: "default"
        });
      } else if (connectionStatus === 'error') {
        const errorMsg = params.get('message') || 'Ocorreu um erro durante a conexão';
        toast({
          title: "Erro de conexão",
          description: errorMsg,
          variant: "destructive"
        });
      }
      
      // Limpar parâmetros de URL após exibir as notificações
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Atualizar os dados
      refetch();
    }
  }, [connectionStatus, toast, refetch]);
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Conexão Shopee</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ShoppingBag className="mr-2" />
              Conecte sua loja Shopee
            </CardTitle>
            <CardDescription>
              Conecte sua loja Shopee para começar a otimizar seus produtos e aumentar suas vendas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Verificando conexão...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {status?.connected ? (
                  <div className="bg-green-50 p-4 rounded-lg flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-green-800">Loja conectada</h3>
                      <p className="text-green-700 text-sm">
                        Sua loja Shopee está conectada e pronta para ser otimizada.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Loja não conectada</h3>
                      <p className="text-yellow-700 text-sm">
                        Você ainda não conectou uma loja Shopee. Clique no botão abaixo para iniciar a conexão.
                      </p>
                    </div>
                  </div>
                )}
                
                {status?.stores && status.stores.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Lojas conectadas</h3>
                    <div className="space-y-3">
                      {status.stores.map((store) => (
                        <div key={store.id} className="border rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{store.shopName}</h4>
                            <p className="text-sm text-gray-500">ID: {store.shopId}</p>
                            <p className="text-sm text-gray-500">
                              {store.isActive ? (
                                <span className="text-green-600 flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Ativa
                                </span>
                              ) : (
                                <span className="text-red-600">Inativa</span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLocation(`/dashboard/store/${store.id}`)}
                            >
                              Detalhes
                            </Button>
                            {store.isActive && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDisconnect(store.id)}
                              >
                                Desconectar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleConnect}
              disabled={isLoading}
            >
              {status?.connected ? 'Conectar outra loja' : 'Conectar loja Shopee'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}