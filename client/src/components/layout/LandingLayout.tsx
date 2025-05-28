import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from 'wouter';
import ReplitPopupLogin from "@/components/ReplitPopupLogin";

function AuthNavigation() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        <a href="/dashboard" className="text-white hover:text-orange-200 transition-colors">
          Dashboard
        </a>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.name?.[0] || user.email[0].toUpperCase()}
            </span>
          </div>
          <span className="text-white text-sm">{user.name || user.email}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <ReplitPopupLogin 
        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-medium"
      >
        Entrar
      </ReplitPopupLogin>
    </div>
  );
}

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/80 backdrop-blur-md border-b border-border' 
          : 'bg-transparent'
      }`}>
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <i className="ri-bird-fill text-white text-sm"></i>
            </div>
            <span className="font-bold text-xl">CIP Shopee</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Recursos
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Preços
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Depoimentos
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Sobre
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <AuthNavigation />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-gray-400 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-2">
                  <i className="ri-bird-fill text-white text-sm"></i>
                </div>
                <h2 className="text-xl font-bold text-white">CIP Shopee</h2>
              </div>
              <p className="max-w-xs">Centro de Inteligência Pardal - Otimização inteligente para lojas Shopee com IA.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-4">Produto</h3>
                <ul className="space-y-2">
                  <li><a href="#features" className="hover:text-white transition">Recursos</a></li>
                  <li><a href="#pricing" className="hover:text-white transition">Planos</a></li>
                  <li><a href="#" className="hover:text-white transition">API</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Empresa</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition">Sobre</a></li>
                  <li><a href="#" className="hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition">Carreiras</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Suporte</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition">Documentação</a></li>
                  <li><a href="#" className="hover:text-white transition">Contato</a></li>
                  <li><a href="#" className="hover:text-white transition">Status</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} CIP Shopee. Todos os direitos reservados.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition"><i className="ri-twitter-x-line"></i></a>
              <a href="#" className="hover:text-white transition"><i className="ri-instagram-line"></i></a>
              <a href="#" className="hover:text-white transition"><i className="ri-linkedin-box-line"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}