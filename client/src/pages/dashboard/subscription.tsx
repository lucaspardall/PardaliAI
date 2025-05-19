import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import SidebarLayout from "@/components/layout/SidebarLayout";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatDate, formatPlanName } from "@/lib/utils/formatters";
import { PLANS } from "@/lib/constants";
import { getPlanIcon } from "@/lib/utils/icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet";

export default function Subscription() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get current plan
  const currentPlan = user?.plan || 'free';
  
  // Get plan expiration message
  const getPlanExpirationMessage = () => {
    if (!user || !user.planExpiresAt || user.plan === 'free') return null;
    
    const expiresAt = new Date(user.planExpiresAt);
    const today = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return "Expirado";
    } else if (daysLeft <= 7) {
      return `Expira em ${daysLeft} dias`;
    } else {
      return `Válido até ${formatDate(user.planExpiresAt)}`;
    }
  };
  
  // Plan progress
  const getStoreProgress = () => {
    if (!user) return 0;
    const { storeLimit } = user;
    const storesUsed = 0; // This would come from the server in a real app
    return Math.min(100, Math.round((storesUsed / storeLimit) * 100));
  };
  
  const getCreditsProgress = () => {
    if (!user) return 0;
    
    // For free plan, show credits used
    if (user.plan === 'free') {
      const totalCredits = 10;
      const usedCredits = 10 - (user.aiCreditsLeft || 0);
      return Math.min(100, Math.round((usedCredits / totalCredits) * 100));
    }
    
    // For paid plans, show unlimited
    return 0;
  };
  
  // Fetch usage data - in a real app, this would come from the server
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ["/api/user/usage"],
    enabled: false, // Disable for MVP since this endpoint isn't implemented yet
  });
  
  // Handle plan update
  const updatePlanMutation = useMutation({
    mutationFn: async (plan: string) => {
      setIsProcessing(true);
      try {
        const response = await apiRequest("PUT", "/api/users/plan", { plan });
        return await response.json();
      } catch (error) {
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Plano atualizado",
        description: `Seu plano foi atualizado para ${formatPlanName(selectedPlan || 'free')} com sucesso!`,
        variant: "success",
      });
      
      // Invalidate user query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Reset selected plan
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message || "Ocorreu um erro ao atualizar seu plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Handle plan selection
  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
  };
  
  // Handle plan upgrade
  const handlePlanUpgrade = () => {
    if (!selectedPlan) {
      toast({
        title: "Nenhum plano selecionado",
        description: "Selecione um plano para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    updatePlanMutation.mutate(selectedPlan);
  };

  if (userLoading) {
    return (
      <SidebarLayout title="Assinatura">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Assinatura">
      <Helmet>
        <title>Assinatura | CIP Shopee</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Current Plan Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Seu Plano Atual</CardTitle>
            <CardDescription>
              Detalhes do seu plano e uso de recursos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-full md:w-1/3 p-6 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary/10 rounded-full mb-4">
                  <i className={`${getPlanIcon(currentPlan)} text-3xl text-primary`}></i>
                </div>
                <h3 className="text-xl font-bold text-center mb-1">
                  Plano {formatPlanName(currentPlan)}
                </h3>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  {user?.planStatus === 'active' && user?.planExpiresAt 
                    ? getPlanExpirationMessage() 
                    : user?.plan === 'free' 
                    ? 'Plano gratuito'
                    : user?.planStatus}
                </p>
                
                {user?.plan !== 'free' && (
                  <Button className="w-full" disabled={isProcessing}>
                    Gerenciar pagamento
                  </Button>
                )}
              </div>
              
              <div className="w-full md:w-2/3 space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-medium">Lojas conectadas</h4>
                    <span className="text-sm text-muted-foreground">0/{user?.storeLimit}</span>
                  </div>
                  <Progress value={getStoreProgress()} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-medium">Créditos de IA</h4>
                    <span className="text-sm text-muted-foreground">
                      {user?.plan === 'free' 
                        ? `${user?.aiCreditsLeft}/10` 
                        : 'Ilimitado'}
                    </span>
                  </div>
                  {user?.plan === 'free' ? (
                    <Progress value={getCreditsProgress()} className="h-2" />
                  ) : (
                    <div className="flex items-center">
                      <Progress value={100} className="h-2 flex-grow" />
                      <span className="ml-3 text-xs">
                        <i className="ri-infinity-line text-muted-foreground text-sm"></i>
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">Recursos do plano</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {PLANS[currentPlan as keyof typeof PLANS].features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <i className="ri-check-line text-green-500 mt-0.5 mr-2 flex-shrink-0"></i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">Status do plano</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="font-medium">
                          <Badge variant={user?.planStatus === 'active' ? 'success' : 'destructive'}>
                            {user?.planStatus === 'active' ? 'Ativo' : user?.planStatus}
                          </Badge>
                        </p>
                      </div>
                      
                      {user?.planExpiresAt && (
                        <div>
                          <p className="text-xs text-muted-foreground">Expira em</p>
                          <p className="font-medium">{formatDate(user.planExpiresAt)}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs text-muted-foreground">Desde</p>
                        <p className="font-medium">{formatDate(user?.createdAt || new Date())}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Upgrade Plan Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Escolha um plano</CardTitle>
            <CardDescription>
              Selecione o melhor plano para suas necessidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={selectedPlan || currentPlan} 
              onValueChange={handlePlanSelect}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {Object.entries(PLANS).map(([key, plan]) => (
                <div key={key} className="relative">
                  <div 
                    className={`border rounded-lg p-6 ${
                      (selectedPlan || currentPlan) === key 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'hover:border-primary/50'
                    } ${
                      key === 'free' ? 'border-dashed' : ''
                    } ${
                      plan.popular ? 'md:-mt-4 md:mb-4' : ''
                    } h-full relative transition-all`}
                  >
                    {plan.popular && plan.highlight && (
                      <div className="absolute -top-3 inset-x-0 flex justify-center">
                        <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                          {plan.highlight}
                        </span>
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3">
                      <RadioGroupItem 
                        value={key} 
                        id={`plan-${key}`} 
                        className={`${currentPlan === key ? 'data-[state=checked]:border-primary data-[state=checked]:border-4' : ''}`}
                      />
                    </div>
                    
                    <div className={`${plan.popular && plan.highlight ? 'pt-3' : ''}`}>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground ml-1">{plan.period}</span>
                      </div>
                      <div className="mt-4">
                        <Label 
                          htmlFor={`plan-${key}`} 
                          className="sr-only"
                        >
                          Selecionar plano {plan.name}
                        </Label>
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start">
                              <i className="ri-check-line text-green-500 mt-0.5 mr-2 flex-shrink-0"></i>
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {currentPlan === key && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-3 left-3"
                    >
                      Plano Atual
                    </Badge>
                  )}
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t pt-6">
            <div className="text-sm text-muted-foreground">
              {selectedPlan && selectedPlan !== currentPlan ? (
                selectedPlan === 'free' ? (
                  <p>Você perderá recursos ao fazer downgrade para o plano gratuito.</p>
                ) : (
                  <p>As alterações serão aplicadas imediatamente após a mudança de plano.</p>
                )
              ) : (
                <p>Para alterar seu plano, selecione uma das opções acima.</p>
              )}
            </div>
            <Button 
              className="sm:min-w-32"
              disabled={!selectedPlan || selectedPlan === currentPlan || isProcessing}
              onClick={handlePlanUpgrade}
            >
              {isProcessing ? (
                <>
                  <i className="ri-loader-2-line animate-spin mr-2"></i>
                  Processando...
                </>
              ) : selectedPlan === 'free' ? (
                'Fazer Downgrade'
              ) : (
                'Atualizar Plano'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Billing Information (would be implemented in a real app) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Informações de Pagamento</CardTitle>
            <CardDescription>
              Gerencie seus métodos de pagamento e histórico de faturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-12 text-center">
              <i className="ri-secure-payment-line text-4xl text-muted-foreground mb-3"></i>
              <p className="text-lg font-medium">Pagamentos não implementados no MVP</p>
              <p className="text-muted-foreground mt-1">
                No MVP, todos os planos são simulados sem integração real de pagamentos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
