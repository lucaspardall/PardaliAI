import React, { useState, useEffect } from "react";
import { SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useTheme } from "@/components/ui/theme-provider";
import { Moon, Sun } from "lucide-react";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl">ShopeeOptimizer</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </button>

            {/* Auth Buttons */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Entrar
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <a 
                href="/dashboard" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Dashboard
              </a>
            </SignedIn>
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
                <i className="ri-bird-fill text-primary text-2xl mr-2"></i>
                <h2 className="text-xl font-bold text-white">CIP Shopee</h2>
              </div>
              <p className="max-w-xs">Otimização inteligente para lojas Shopee com tecnologia de IA.</p>
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
```