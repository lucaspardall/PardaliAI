import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { SignInButton } from '@clerk/nextjs';

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
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para transformar sua loja Shopee com o CIP Shopee?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de vendedores que já aumentaram suas vendas com nossa IA.
              Comece seu teste gratuito hoje mesmo!
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 mr-4">
                <i className="ri-gift-line mr-2"></i>
                Teste Grátis por 7 Dias
              </Button>
            </SignInButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}