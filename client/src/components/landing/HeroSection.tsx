import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Otimize seus produtos da 
            <span className="text-blue-600"> Shopee</span> com IA
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Aumente suas vendas com otimizações inteligentes de títulos, descrições e palavras-chave. 
            Nossa IA analisa e melhora seus produtos automaticamente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 py-3">
                  Começar Grátis
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-3">
                  Ir para Dashboard
                </Button>
              </Link>
            )}
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Ver Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}