import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function PricingSection() {
  const { isAuthenticated, user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Get current user plan if authenticated
  const currentPlan = user?.plan || null;

  return (
    <section id="pricing" className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 font-heading gradient-heading">
            Planos simples, resultados extraordinários
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano ideal para seu negócio e comece a otimizar sua loja hoje mesmo.
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
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
              Anual <span className="text-xs text-emerald-500 font-bold">Economize 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {Object.entries(PLANS).map(([key, plan], index) => {
            // Calculate yearly price with 20% discount
            const price = billingPeriod === 'yearly' && key !== 'free'
              ? `R$${Math.floor(parseInt(plan.price.replace('R$', '')) * 0.8 * 12)}`
              : plan.price;

            const period = billingPeriod === 'yearly' && key !== 'free'
              ? '/ano'
              : plan.period;

            return (
              <motion.div 
                key={key}
                className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <Card className={`h-full flex flex-col ${
                  plan.popular 
                    ? 'border-primary shadow-lg' 
                    : key === 'free' ? 'border-dashed' : ''
                }`}>
                  {plan.popular && plan.highlight && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                        {plan.highlight}
                      </span>
                    </div>
                  )}
                  <CardHeader className={`${plan.popular && plan.highlight ? 'pt-6' : ''}`}>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-2 flex items-baseline">
                      <span className="text-3xl font-bold">{price}</span>
                      <span className="text-muted-foreground ml-1">{period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <i className={`ri-check-line mr-2 text-primary text-lg`}></i>
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant={plan.popular ? "default" : "outline"} 
                      className="w-full"
                      asChild
                    >
                      {isAuthenticated ? (
                        currentPlan === key ? (
                          <span className="cursor-default">Plano Atual</span>
                        ) : (
                          <a href="/dashboard/subscription">{plan.ctaText}</a>
                        )
                      ) : (
                        <a href="/api/login">{plan.ctaText}</a>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-muted-foreground">
            Precisa de mais recursos? Conheça nosso{" "}
            <a href="#" className="text-primary font-medium">
              Plano Enterprise
            </a>{" "}
            para grandes operações.
          </p>
        </div>
      </div>
    </section>
  );
}