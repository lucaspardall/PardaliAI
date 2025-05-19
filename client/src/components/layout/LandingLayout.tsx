import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { useState, useEffect } from "react";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className={`sticky top-0 z-50 ${isScrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'} transition-all duration-200 py-4`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <i className="ri-bird-fill text-primary text-3xl mr-2"></i>
            <h1 className="text-2xl font-bold text-foreground font-heading">CIP Shopee</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2"
            >
              {theme === "dark" ? (
                <i className="ri-sun-line text-xl"></i>
              ) : (
                <i className="ri-moon-line text-xl"></i>
              )}
            </Button>
            
            {isLoading ? (
              <div className="h-10 w-24 bg-muted animate-pulse rounded-lg"></div>
            ) : isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <a href="/api/login">Comece grátis</a>
              </Button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2"
            >
              {theme === "dark" ? (
                <i className="ri-sun-line text-xl"></i>
              ) : (
                <i className="ri-moon-line text-xl"></i>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <i className="ri-close-line text-xl"></i>
              ) : (
                <i className="ri-menu-line text-xl"></i>
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border mt-4 py-4">
            <div className="container mx-auto px-4 space-y-4 flex flex-col">
              <a 
                href="#features" 
                className="text-foreground py-2 px-4 rounded-md hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Recursos
              </a>
              <a 
                href="#pricing" 
                className="text-foreground py-2 px-4 rounded-md hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Planos
              </a>
              
              {isLoading ? (
                <div className="h-10 bg-muted animate-pulse rounded-lg"></div>
              ) : isAuthenticated ? (
                <Button asChild className="w-full">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <a href="/api/login">Comece grátis</a>
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
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
