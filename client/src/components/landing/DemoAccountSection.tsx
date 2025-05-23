import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Tipos para a API de demonstração
interface DemoCredentials {
  username: string;
  password: string;
}

interface DemoUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  storeCount: number;
}

interface DemoAccountInfo {
  exists: boolean;
  user?: DemoUser;
  credentials?: DemoCredentials;
  instructions?: string[];
};

export function DemoAccountSection() {
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  
  // Buscar informações da conta demo, se existir
  const { data: demoAccount, isLoading, isError, refetch } = useQuery<DemoAccountInfo>({
    queryKey: ['/api/demo/demo-account-info'],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Função para criar conta de demonstração
  const handleCreateDemoAccount = async () => {
    try {
      setIsCreatingDemo(true);
      await fetch('/api/demo/create-demo-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await refetch();
    } catch (error) {
      console.error('Erro ao criar conta de demonstração:', error);
    } finally {
      setIsCreatingDemo(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full max-w-md mb-8" />
          <Skeleton className="h-[300px] w-full max-w-2xl mx-auto rounded-xl" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-16 bg-muted/30" id="demo">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="outline" className="mb-4 border-primary text-primary">
            Exclusivo para a Equipe Shopee
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Acesso à Demonstração</h2>
          <p className="text-muted-foreground">
            Teste a plataforma CIP Shopee com uma conta pré-configurada contendo dados de demonstração.
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary/10 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Conta de Demonstração</span>
                {demoAccount?.exists && (
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800">Disponível</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Acesse todas as funcionalidades do CIP Shopee com dados pré-configurados
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              {demoAccount?.exists ? (
                <Tabs defaultValue="credentials" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="credentials">Credenciais</TabsTrigger>
                    <TabsTrigger value="instructions">Instruções</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="credentials" className="p-4 bg-muted/50 rounded-lg mt-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium mb-1">Usuário</h3>
                        <div className="bg-background border rounded-md p-2 flex justify-between items-center">
                          <code className="text-sm">{demoAccount?.credentials?.username || ''}</code>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => demoAccount?.credentials?.username && navigator.clipboard.writeText(demoAccount.credentials.username)}
                            className="h-7 px-2" 
                          >
                            <i className="ri-clipboard-line text-muted-foreground"></i>
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-1">Senha</h3>
                        <div className="bg-background border rounded-md p-2 flex justify-between items-center">
                          <code className="text-sm">{demoAccount?.credentials?.password || ''}</code>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => demoAccount?.credentials?.password && navigator.clipboard.writeText(demoAccount.credentials.password)}
                            className="h-7 px-2" 
                          >
                            <i className="ri-clipboard-line text-muted-foreground"></i>
                          </Button>
                        </div>
                      </div>
                      
                      <Alert variant="default" className="mt-4 bg-primary/5 border-primary/30">
                        <i className="ri-information-line mr-2"></i>
                        <AlertTitle>Informações da conta</AlertTitle>
                        <AlertDescription className="mt-2">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Nome: {demoAccount?.user?.name || 'Usuário Demo'}</li>
                            <li>Email: {demoAccount?.user?.email || 'demo@cipshopee.com'}</li>
                            <li>Plano: {demoAccount?.user?.plan ? demoAccount.user.plan.toUpperCase() : 'PRO'}</li>
                            <li>Lojas conectadas: {demoAccount?.user?.storeCount || 0}</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="instructions" className="space-y-4 p-4 bg-muted/50 rounded-lg mt-4">
                    <div className="space-y-3">
                      {demoAccount?.instructions?.map((instruction, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold">{index+1}</span>
                          </div>
                          <p className="text-sm">{instruction}</p>
                        </div>
                      ))}
                    </div>
                    
                    <Button asChild className="w-full mt-4">
                      <a href="/api/login">Acessar Demonstração</a>
                    </Button>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <p>A conta de demonstração ainda não foi criada. Clique no botão abaixo para criar uma conta com dados pré-configurados para avaliação.</p>
                  
                  <Button 
                    onClick={handleCreateDemoAccount} 
                    disabled={isCreatingDemo}
                    className="w-full"
                  >
                    {isCreatingDemo ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Criando demonstração...
                      </>
                    ) : 'Criar Conta de Demonstração'}
                  </Button>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex-col items-start space-y-2 pt-0 text-sm text-muted-foreground">
              <p>
                <i className="ri-shield-check-line mr-1 text-green-500"></i>
                Esta conta é exclusiva para testes e avaliação da plataforma.
              </p>
              <p>
                <i className="ri-refresh-line mr-1"></i>
                Os dados de demonstração podem ser recriados a qualquer momento.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}