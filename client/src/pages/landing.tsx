import LandingLayout from "@/components/layout/LandingLayout";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import { Helmet } from "react-helmet";

export default function Landing() {
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
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </LandingLayout>
    </>
  );
}