import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';

export default function CTASection() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-96 mx-auto mb-8"></div>
            <div className="h-12 bg-white/20 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para Otimizar sua Loja?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de vendedores que já estão usando nossa IA para aumentar suas vendas no Shopee.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg"
                >
                  <i className="ri-dashboard-3-line mr-2"></i>
                  Ir para Dashboard
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg" 
                className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg"
                onClick={() => window.location.href = '/login'}
              >
                <i className="ri-rocket-line mr-2"></i>
                Começar Grátis
              </Button>
            )}

            <Link href="#features">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 text-lg"
              >
                <i className="ri-information-line mr-2"></i>
                Saber Mais
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}