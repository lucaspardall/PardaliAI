import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface HeroSectionProps {
  onOpenLogin?: () => void;
}

export default function HeroSection({ onOpenLogin }: HeroSectionProps) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <section className="bg-gradient-to-r from-secondary to-secondary-800 text-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center">
          <motion.div 
            className="lg:w-1/2 lg:pr-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
              Aumente suas vendas na Shopee em até 45% com IA
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              Otimize títulos, descrições e performance automaticamente. Mais de 500 vendedores já aumentaram suas conversões e visibilidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isLoading ? (
                <div className="h-12 w-40 bg-white/10 rounded-lg animate-pulse"></div>
              ) : isAuthenticated ? (
                <Button asChild size="lg" className="shadow-lg">
                  <Link href="/dashboard">
                    Acessar Dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="shadow-lg" onClick={onOpenLogin}>
                  Comece grátis
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/20 hover:bg-white/20">
                <a href="#features">
                  Ver recursos
                </a>
              </Button>
            </div>
          </motion.div>
          <motion.div 
            className="lg:w-1/2 mt-10 lg:mt-0"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="rounded-xl shadow-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 relative">
              <div className="absolute top-0 left-0 right-0 h-10 bg-secondary/80 flex items-center px-4">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="pt-10">
                <svg viewBox="0 0 1000 500" className="w-full h-auto" preserveAspectRatio="none">
                  {/* Graph background */}
                  <rect x="0" y="0" width="1000" height="500" fill="rgba(0,0,0,0.1)" />

                  {/* Grid lines */}
                  <g stroke="rgba(255,255,255,0.1)" strokeWidth="1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line key={`h-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="500" />
                    ))}
                  </g>

                  {/* Data bars */}
                  <g>
                    {[350, 280, 400, 320, 450, 380, 480, 420, 500, 550].map((height, i) => (
                      <rect 
                        key={`bar-${i}`} 
                        x={i * 100 + 10} 
                        y={500 - height} 
                        width="80" 
                        height={height}
                        fill="rgba(255, 87, 34, 0.7)"
                        rx="4"
                        ry="4"
                      />
                    ))}
                  </g>

                  {/* Performance line */}
                  <polyline 
                    points="50,400 150,350 250,370 350,300 450,280 550,260 650,220 750,180 850,150 950,120" 
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data points */}
                  {[400, 350, 370, 300, 280, 260, 220, 180, 150, 120].map((y, i) => (
                    <circle 
                      key={`point-${i}`}
                      cx={i * 100 + 50}
                      cy={y}
                      r="6"
                      fill="#0ea5e9"
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}