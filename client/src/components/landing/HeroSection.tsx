import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import ReplitPopupLogin from "@/components/ReplitPopupLogin";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjU5ZTBiIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <i className="ri-bird-fill text-3xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-orange-500 bg-clip-text text-transparent">
              CIP Shopee
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            <span className="font-semibold text-orange-600">Centro de Inteligência Pardal</span> - 
            Otimize títulos, descrições e performance de produtos automaticamente para 
            <span className="font-semibold text-gray-900"> aumentar conversões e visibilidade na Shopee</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              onClick={() => window.location.href = '/api/login'}
            >
              <i className="ri-rocket-line mr-2"></i>
              Começar Agora - GRÁTIS
            </Button>

            <Button asChild variant="outline" size="lg" className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg font-semibold transition-all duration-300">
              <Link href="#features">
                <i className="ri-play-circle-line mr-2"></i>
                Ver Como Funciona
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <i className="ri-check-line text-green-500"></i>
              <span>Sem configuração complexa</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="ri-check-line text-green-500"></i>
              <span>Resultados em minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="ri-check-line text-green-500"></i>
              <span>100% focado na Shopee</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}