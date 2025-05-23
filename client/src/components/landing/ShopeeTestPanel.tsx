import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DemoInfo {
  username?: string;
  password?: string;
  status?: "created" | "error";
  message?: string;
}

export function ShopeeTestPanel() {
  const [isCreating, setIsCreating] = useState(false);
  const [demoInfo, setDemoInfo] = useState<DemoInfo | null>(null);
  
  const createDemoAccount = async () => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/demo/create-demo-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setDemoInfo({
          username: data.demoAccount.username,
          password: data.demoAccount.password,
          status: "created",
          message: data.message
        });
      } else {
        setDemoInfo({
          status: "error",
          message: data.message || "Erro ao criar conta de demonstração"
        });
      }
    } catch (error) {
      setDemoInfo({
        status: "error",
        message: "Erro ao criar conta de demonstração. Tente novamente mais tarde."
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div id="shopee-test" className="py-16 bg-orange-50/50 dark:bg-orange-950/10 border-y border-orange-100 dark:border-orange-900/30">
      <div className="container mx-auto max-w-3xl">
        <Card className="border-2 border-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800">
                Para Equipe Shopee
              </Badge>
            </div>
            <CardTitle className="text-2xl">Demonstração do CIP Shopee</CardTitle>
            <CardDescription>
              Avalie nossa plataforma de otimização para lojas Shopee com dados pré-configurados
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {demoInfo?.status === "created" ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-md border border-green-200 dark:border-green-800">
                  <p className="font-medium mb-1">✅ Conta de demonstração criada com sucesso!</p>
                  <p className="text-sm">Use as credenciais abaixo para acessar a plataforma.</p>
                </div>
                
                <div className="bg-muted p-4 rounded-md space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Usuário</p>
                    <div className="flex items-center justify-between bg-background border rounded-md p-2">
                      <code className="text-sm">{demoInfo.username || "testeshopee"}</code>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => demoInfo.username && navigator.clipboard.writeText(demoInfo.username)}
                        className="h-7 px-2" 
                      >
                        <i className="ri-clipboard-line text-muted-foreground"></i>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Senha</p>
                    <div className="flex items-center justify-between bg-background border rounded-md p-2">
                      <code className="text-sm">{demoInfo.password || "ShopeeTest2025!"}</code>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => demoInfo.password && navigator.clipboard.writeText(demoInfo.password)}
                        className="h-7 px-2" 
                      >
                        <i className="ri-clipboard-line text-muted-foreground"></i>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button asChild className="w-full">
                  <a href="/api/login">Acessar Demonstração</a>
                </Button>
                
                <div className="text-sm text-muted-foreground border-t pt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <i className="ri-information-line text-primary mt-0.5"></i>
                    <p>A conta de demonstração possui dados pré-configurados, incluindo lojas, produtos e histórico de otimizações.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <i className="ri-database-2-line text-primary mt-0.5"></i>
                    <p>Todos os dados são fictícios e apenas para fins de demonstração da plataforma.</p>
                  </div>
                </div>
              </div>
            ) : demoInfo?.status === "error" ? (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md border border-red-200 dark:border-red-800">
                  <p className="font-medium">❌ Erro ao criar conta de demonstração</p>
                  <p className="text-sm mt-1">{demoInfo.message}</p>
                </div>
                
                <Button onClick={createDemoAccount} disabled={isCreating} className="w-full">
                  {isCreating ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Tentando novamente...
                    </>
                  ) : 'Tentar novamente'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  Para avaliar o CIP Shopee, você pode criar uma conta de demonstração com dados pré-configurados.
                  Esta conta terá acesso completo a todas as funcionalidades, incluindo:
                </p>
                
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <i className="ri-store-2-line text-primary mt-0.5"></i>
                    <div>
                      <strong className="font-medium">Lojas conectadas</strong>
                      <p className="text-sm text-muted-foreground">Múltiplas lojas de diferentes categorias já configuradas</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-shopping-bag-3-line text-primary mt-0.5"></i>
                    <div>
                      <strong className="font-medium">Catálogo de produtos</strong>
                      <p className="text-sm text-muted-foreground">Produtos diversos com histórico de vendas e métricas</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-line-chart-line text-primary mt-0.5"></i>
                    <div>
                      <strong className="font-medium">Análises e estatísticas</strong>
                      <p className="text-sm text-muted-foreground">Dados de desempenho e métricas para avaliação</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-ai-generate text-primary mt-0.5"></i>
                    <div>
                      <strong className="font-medium">Otimizações geradas por IA</strong>
                      <p className="text-sm text-muted-foreground">Sugestões de melhoria para produtos com justificativas detalhadas</p>
                    </div>
                  </li>
                </ul>
                
                <Button 
                  onClick={createDemoAccount} 
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Criando conta de demonstração...
                    </>
                  ) : 'Criar Conta de Demonstração'}
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex-col gap-2 items-start pt-0 text-sm text-muted-foreground border-t">
            <p>
              <i className="ri-shield-check-line mr-1 text-green-500"></i>
              Esta demonstração não requer cadastro real ou integrações com a Shopee.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}