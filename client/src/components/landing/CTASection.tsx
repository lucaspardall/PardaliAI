
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SignInButton } from '@clerk/clerk-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';

export default function CTASection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-red-500">
      <div className="container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Pronto para transformar sua loja Shopee com o CIP Shopee?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de vendedores que já aumentaram suas vendas com nossa IA.
              Comece seu teste gratuito hoje mesmo!
            </p>
            {!isAuthenticated ? (
              <SignInButton mode="modal">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-orange-600 font-semibold px-8">
                  <i className="ri-gift-line mr-2"></i>
                  Teste Grátis por 7 Dias
                </Button>
              </SignInButton>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-orange-600 font-semibold px-8">
                  <i className="ri-dashboard-line mr-2"></i>
                  Ir para Dashboard
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
