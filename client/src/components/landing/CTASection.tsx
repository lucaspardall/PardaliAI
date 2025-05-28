import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import ReplitPopupLogin from "@/components/ReplitPopupLogin";

export default function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

      <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Pronto para <span className="text-yellow-300">aumentar suas vendas</span>?
          </h2>

          <p className="text-xl text-orange-100 max-w-2xl mx-auto">
            Junte-se a milhares de vendedores que já estão usando o CIP Shopee para 
            otimizar seus produtos e aumentar suas conversões.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ReplitPopupLogin 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <i className="ri-rocket-2-line mr-2"></i>
              Começar Gratuitamente
            </ReplitPopupLogin>

            <div className="text-sm text-orange-100">
              <i className="ri-shield-check-line mr-1"></i>
              Sem cartão de crédito necessário
            </div>
          </div>

          <div className="pt-8 border-t border-orange-400/30">
            <div className="flex flex-wrap justify-center gap-8 text-orange-100">
              <div className="flex items-center gap-2">
                <i className="ri-group-line text-xl"></i>
                <span className="font-semibold">5.000+</span>
                <span>vendedores ativos</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-shopping-bag-line text-xl"></i>
                <span className="font-semibold">50K+</span>
                <span>produtos otimizados</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-line-chart-line text-xl"></i>
                <span className="font-semibold">+35%</span>
                <span>aumento médio em vendas</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}