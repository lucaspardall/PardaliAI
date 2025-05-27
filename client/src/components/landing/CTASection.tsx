import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function CTASection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 px-4 bg-blue-600">
      <div className="container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para aumentar suas vendas?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de vendedores que já estão otimizando seus produtos com nossa IA.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <Link href="/login">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                  Começar Agora
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                  Ir para Dashboard
                </Button>
              </Link>
            )}
            <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
              Saiba Mais
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}