import LandingLayout from "@/components/layout/LandingLayout";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import { Helmet } from "react-helmet";

// Dummy FeaturesSection component to apply the icon changes
function FeaturesSection() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-semibold mb-8">Principais Funcionalidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10"></div>
            <h3 className="text-xl font-semibold mb-2">Análise de performance</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10"></div>
            <h3 className="text-xl font-semibold mb-2">Otimização por IA</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10"></div>
            <h3 className="text-xl font-semibold mb-2">Integração completa</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10"></div>
            <h3 className="text-xl font-semibold mb-2">Alertas inteligentes</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10"></div>
            <h3 className="text-xl font-semibold mb-2">Relatórios detalhados</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10"></div>
            <h3 className="text-xl font-semibold mb-2">Implementação rápida</h3>
          </div>
        </div>
      </div>
    </section>
  );
}


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
```

```javascript
import LandingLayout from "@/components/layout/LandingLayout";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import { Helmet } from "react-helmet";

// Dummy FeaturesSection component to apply the icon changes
function FeaturesSection() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-semibold mb-8">Principais Funcionalidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
              <i className="ri-line-chart-line text-2xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Análise de performance</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
              <i className="ri-ai-generate text-2xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Otimização por IA</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
              <i className="ri-link text-2xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Integração completa</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
              <i className="ri-notification-3-line text-2xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Alertas inteligentes</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
              <i className="ri-file-chart-line text-2xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Relatórios detalhados</h3>
          </div>
          <div className="max-w-sm p-6 bg-card rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
              <i className="ri-rocket-line text-2xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Implementação rápida</h3>
          </div>
        </div>
      </div>
    </section>
  );
}


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