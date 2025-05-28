import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';

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
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Potencialize sua loja 
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"> Shopee</span> com IA
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Transforme seus produtos em campeões de vendas! Nossa inteligência artificial otimiza títulos, 
            descrições e palavras-chave automaticamente, aumentando sua visibilidade e conversões na Shopee.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isAuthenticated ? (

              <Button 
                onClick={() => window.location.href = '/login'}
                size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
              >
                <i className="ri-rocket-line mr-2"></i>
                Começar Grátis
              </Button>

            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg">
                  <i className="ri-dashboard-line mr-2"></i>
                  Ir para Dashboard
                </Button>
              </Link>
            )}
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-2 hover:bg-muted">
              <i className="ri-play-circle-line mr-2"></i>
              Ver Demo
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <i className="ri-check-line text-green-500"></i>
              <span>Teste grátis por 7 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="ri-check-line text-green-500"></i>
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="ri-check-line text-green-500"></i>
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}