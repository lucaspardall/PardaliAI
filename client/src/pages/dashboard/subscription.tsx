
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { PLANS } from "@/lib/constants";

interface PaymentPlan {
  id: string;
  name: string;
  prices: {
    monthly: string;
    yearly: string;
  };
  features: string[];
  storeLimit: number;
  aiCredits: number | 'unlimited';
}

interface SubscriptionInfo {
  user: {
    plan: string;
    planStatus: string;
    planExpiresAt: string | null;
    storeLimit: number;
    aiCreditsLeft: number;
  };
  currentPlan: PaymentPlan | null;
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
  } | null;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch subscription info
  const { data: subscriptionInfo, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ['/api/payments/subscription'],
    queryFn: () => apiRequest('GET', '/api/payments/subscription').then(res => res.json()),
  });

  // Fetch available plans
  const { data: plansData } = useQuery({
    queryKey: ['/api/payments/plans'],
    queryFn: () => apiRequest('GET', '/api/payments/plans').then(res => res.json()),
  });

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId, billingPeriod })
      });
      if (!response.ok) throw new Error('Failed to create checkout session');
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
      setIsProcessing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao iniciar pagamento",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  // Portal mutation for billing management
  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/payments/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create portal session');
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao acessar portal de pagamentos",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async (immediately: boolean = false) => {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ immediately })
      });
      if (!response.ok) throw new Error('Failed to cancel subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription'] });
      toast({
        title: "Sucesso",
        description: "Assinatura cancelada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar assinatura",
        variant: "destructive",
      });
    },
  });

  const currentPlan = subscriptionInfo?.user.plan || 'free';
  const plans = plansData?.plans || {};

  const formatPlanName = (plan: string) => {
    const planNames: Record<string, string> = {
      free: 'Gratuito',
      starter: 'Starter',
      pro: 'Pro',
      enterprise: 'Enterprise'
    };
    return planNames[plan] || plan;
  };

  const getPlanIcon = (plan: string) => {
    const icons: Record<string, string> = {
      free: 'ri-gift-line',
      starter: 'ri-rocket-line',
      pro: 'ri-star-line',
      enterprise: 'ri-building-line'
    };
    return icons[plan] || 'ri-user-line';
  };

  const handleUpgrade = (planId: string) => {
    setIsProcessing(true);
    checkoutMutation.mutate({ planId });
  };

  const handleManageBilling = () => {
    setIsProcessing(true);
    portalMutation.mutate();
  };

  const handleCancelSubscription = () => {
    if (confirm('Tem certeza que deseja cancelar sua assinatura? Ela será cancelada no final do período atual.')) {
      cancelMutation.mutate(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie seu plano e informações de pagamento
          </p>
        </div>

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
                  {subscriptionInfo?.subscription 
                    ? `Ativo até ${new Date(subscriptionInfo.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : 'Plano gratuito'}
                </p>

                {subscriptionInfo?.subscription && (
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={handleManageBilling}
                      disabled={isProcessing || portalMutation.isPending}
                    >
                      {portalMutation.isPending ? 'Carregando...' : 'Gerenciar pagamento'}
                    </Button>
                    
                    {!subscriptionInfo.subscription.cancelAtPeriodEnd && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleCancelSubscription}
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar assinatura'}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm">Lojas conectadas</h4>
                    <p className="text-2xl font-bold">0 / {subscriptionInfo?.user.storeLimit || 1}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Créditos de IA</h4>
                    <p className="text-2xl font-bold">
                      {subscriptionInfo?.user.aiCreditsLeft === 999999 
                        ? 'Ilimitado' 
                        : subscriptionInfo?.user.aiCreditsLeft || 0}
                    </p>
                  </div>
                </div>

                {subscriptionInfo?.subscription?.cancelAtPeriodEnd && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <i className="ri-information-line"></i>
                      <span className="font-medium">Assinatura será cancelada</span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      Sua assinatura será cancelada em {new Date(subscriptionInfo.subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Plans */}
        {currentPlan === 'free' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Upgrade seu plano</CardTitle>
              <CardDescription>
                Desbloqueie recursos avançados com nossos planos pagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Billing Period Toggle */}
              <div className="flex justify-center mb-6">
                <div className="bg-muted p-1 rounded-lg flex items-center">
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      billingPeriod === 'monthly' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setBillingPeriod('monthly')}
                  >
                    Mensal
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      billingPeriod === 'yearly' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setBillingPeriod('yearly')}
                  >
                    Anual <span className="text-xs text-emerald-500 font-bold">-20%</span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(plans).map(([key, plan]: [string, any]) => {
                  const monthlyPrice = billingPeriod === 'yearly' 
                    ? Math.floor(parseInt(PLANS[key]?.price.replace('R$', '') || '0') * 0.8)
                    : parseInt(PLANS[key]?.price.replace('R$', '') || '0');
                  
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Object.keys(plans).indexOf(key) * 0.1 }}
                    >
                      <Card className={`relative ${key === 'pro' ? 'border-primary shadow-lg' : ''}`}>
                        {key === 'pro' && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground">
                              Mais Popular
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader className="text-center pb-4">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="space-y-1">
                            <div className="text-3xl font-bold">
                              R${monthlyPrice}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              por mês{billingPeriod === 'yearly' && ', cobrado anualmente'}
                            </p>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <ul className="space-y-3 mb-6">
                            {plan.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-center text-sm">
                                <i className="ri-check-line text-green-500 mr-2"></i>
                                {feature}
                              </li>
                            ))}
                          </ul>
                          
                          <Button 
                            className="w-full"
                            variant={key === 'pro' ? 'default' : 'outline'}
                            onClick={() => handleUpgrade(key)}
                            disabled={isProcessing || checkoutMutation.isPending}
                          >
                            {checkoutMutation.isPending ? 'Processando...' : 'Escolher plano'}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>
              Para ver seu histórico completo de pagamentos e faturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionInfo?.subscription ? (
              <div className="text-center py-6">
                <Button 
                  onClick={handleManageBilling}
                  disabled={portalMutation.isPending}
                >
                  <i className="ri-external-link-line mr-2"></i>
                  Ver histórico de pagamentos
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center">
                <i className="ri-file-list-3-line text-4xl text-muted-foreground mb-3"></i>
                <p className="text-lg font-medium">Nenhum histórico de pagamento</p>
                <p className="text-muted-foreground mt-1">
                  Você está no plano gratuito. Faça upgrade para ver o histórico de pagamentos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
