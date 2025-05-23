import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
            Pronto para impulsionar suas vendas na Shopee?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Junte-se a centenas de vendedores que estão aumentando seus resultados com CIP Shopee.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-primary hover:bg-primary-50 px-8"
              asChild
            >
              {isAuthenticated ? (
                <a href="/dashboard">Acessar Dashboard</a>
              ) : (
                <a href="/api/login">Começar agora</a>
              )}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/20 px-8"
              asChild
            >
              <a href="/demo/login">Experimentar demonstração</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
