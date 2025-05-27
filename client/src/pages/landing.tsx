import LandingLayout from "@/components/layout/LandingLayout";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import { Helmet } from "react-helmet";

export default function Landing() {
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
      </LandingLayout>
    </>
  );
}