import LandingLayout from "@/components/layout/LandingLayout";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import { Helmet } from "react-helmet";
import { ArrowRight, CheckCircle, Star, Users, TrendingUp, Zap, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useLocation } from 'wouter';

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <>
      <Helmet>
        <title>CIP Shopee - Centro de Inteligência Pardal para Vendedores Shopee</title>
        <meta 
          name="description" 
          content="Transforme sua loja Shopee com o CIP Shopee! Nossa IA otimiza títulos, descrições e palavras-chave automaticamente. Aumente suas vendas e visibilidade na plataforma."
        />
        <meta property="og:title" content="CIP Shopee - Centro de Inteligência Pardal para Otimização Shopee" />
        <meta property="og:description" content="Plataforma de IA que otimiza automaticamente seus produtos na Shopee. Aumente vendas, melhore rankings e maximize resultados." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="shopee, otimização, IA, vendas, produtos, e-commerce, marketplace" />
      </Helmet>
      <LandingLayout>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
        
        {/* Auth Navigation */}
        <SignedOut>
          <div className="fixed bottom-6 right-6 z-50">
            <SignInButton mode="modal">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-xl animate-pulse"
              >
                <i className="ri-gift-line mr-2"></i>
                Teste Grátis
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
        
        <SignedIn>
          <div className="fixed bottom-6 right-6 z-50">
            <Button 
              size="lg" 
              onClick={() => setLocation('/dashboard')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-xl"
            >
              <i className="ri-dashboard-line mr-2"></i>
              Dashboard
            </Button>
          </div>
        </SignedIn>
      </LandingLayout>
    </>
  );
}