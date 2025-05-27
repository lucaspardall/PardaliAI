import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SignInButton } from '@clerk/clerk-react';
import { motion } from "framer-motion";

export default function CTASection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="bg-primary py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6 font-heading">
            Experimente grátis por 7 dias e veja resultados em 72 horas
          </h2>
          <p className="text-xl text-white/80 mb-4 max-w-3xl mx-auto">
            Mais de 500 vendedores já aumentaram suas vendas em 27%. Configure sua loja em minutos e otimize automaticamente.
          </p>
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-4 text-white text-sm">
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400"></i>
                  <span>7 dias grátis</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400"></i>
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400"></i>
                  <span>Cancele quando quiser</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg">
                <a href="/dashboard">
                  Acessar Dashboard
                </a>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg">
                  🚀 Teste Grátis 7 Dias
                </Button>
              </SignInButton>
            )}
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Falar com Especialista
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}