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
            Comece hoje e veja resultados em 72 horas
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Mais de 500 vendedores já aumentaram suas vendas em 27%. Configure sua loja em minutos e otimize automaticamente.
          </p>
          <div className="flex justify-center">
            {isAuthenticated ? (
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-primary hover:bg-primary-50 px-8"
                asChild
              >
                <a href="/dashboard">Acessar Dashboard</a>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white text-primary hover:bg-primary-50 px-8"
                >
                  Começar agora
                </Button>
              </SignInButton>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}