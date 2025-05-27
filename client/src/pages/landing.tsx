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
        <title>CIP Shopee - Otimização Inteligente para Lojas Shopee</title>
        <meta 
          name="description" 
          content="Impulsione suas vendas na Shopee com Inteligência Artificial. Otimize produtos e alcance mais clientes automaticamente."
        />
        <meta property="og:title" content="CIP Shopee - Otimização para Lojas Shopee" />
        <meta property="og:description" content="Impulsione suas vendas na Shopee com IA. Plataforma completa para análise e otimização de produtos." />
        <meta property="og:type" content="website" />
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
                className="bg-primary hover:bg-primary/90 shadow-xl animate-pulse"
              >
                <i className="ri-gift-line mr-2"></i>
                Grátis 7 Dias
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
        
        <SignedIn>
          <div className="fixed bottom-6 right-6 z-50">
            <Button 
              size="lg" 
              onClick={() => setLocation('/dashboard')}
              className="bg-primary hover:bg-primary/90 shadow-xl"
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