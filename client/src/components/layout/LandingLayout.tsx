import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { useState, useEffect } from "react";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import EmailAuth from "@/components/auth/EmailAuth";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [authMethod, setAuthMethod] = React.useState<'replit' | 'email'>('replit');
  const [isLoading, setIsLoading] = React.useState(false);



  const openLoginModal = () => {
    setLoginModalOpen(true);
  };

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user', { credentials: 'include' });
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a 
              href="#features" 
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              Recursos
            </a>
            <a 
              href="#pricing" 
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              Planos
            </a>
            <a 
              href="#" 
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              Suporte
            </a>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="border-primary/20 hover:bg-primary/10"
            >
              {theme === "dark" ? (
                <i className="ri-sun-line text-xl text-primary"></i>
              ) : (
                <i className="ri-moon-line text-xl text-primary"></i>
              )}
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Button asChild variant="ghost">
                  <Link href="/dashboard">
                    <i className="ri-dashboard-line mr-2"></i>
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={openLoginModal}>
                  Entrar
                </Button>
                <Button onClick={openLoginModal} className="bg-primary hover:bg-primary/90">
                  <i className="ri-rocket-line mr-2"></i>
                  Comece grátis
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="border-primary/20 hover:bg-primary/10"
            >
              {theme === "dark" ? (
                <i className="ri-sun-line text-xl text-primary"></i>
              ) : (
                <i className="ri-moon-line text-xl text-primary"></i>
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
          <div className="md:hidden bg-background border-t border-border mt-4 py-6">
            <div className="container mx-auto px-4 space-y-6 flex flex-col">
              {/* Navigation Links */}
              <div className="space-y-1">
                <a 
                  href="#features" 
                  className="flex items-center text-foreground py-3 px-4 rounded-lg hover:bg-muted transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="ri-star-line mr-3 text-primary"></i>
                  Recursos
                </a>
                <a 
                  href="#pricing" 
                  className="flex items-center text-foreground py-3 px-4 rounded-lg hover:bg-muted transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="ri-price-tag-3-line mr-3 text-primary"></i>
                  Planos
                </a>
                <a 
                  href="#" 
                  className="flex items-center text-foreground py-3 px-4 rounded-lg hover:bg-muted transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="ri-customer-service-2-line mr-3 text-primary"></i>
                  Suporte
                </a>
              </div>

              {/* Divider */}
              <div className="border-t border-border"></div>

              {/* Auth Actions */}
              {isAuthenticated ? (
                <div className="space-y-3">
                  <Button asChild className="w-full bg-primary hover:bg-primary/90" size="lg">
                    <Link href="/dashboard">
                      <i className="ri-dashboard-line mr-2"></i>
                      Acessar Dashboard
                    </Link>
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    👋 Bem-vindo de volta!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90" 
                    size="lg"
                    onClick={() => { openLoginModal(); setMobileMenuOpen(false); }}
                  >
                    <i className="ri-rocket-line mr-2"></i>
                    Comece grátis
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => { openLoginModal(); setMobileMenuOpen(false); }}
                  >
                    <i className="ri-login-box-line mr-2"></i>
                    Já tenho conta
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {React.Children.map(children, child => 
          React.isValidElement(child) 
            ? React.cloneElement(child as React.ReactElement<any>, { onOpenLogin: openLoginModal })
            : child
        )}
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

      {/* Modal de Login */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="sm:max-w-lg w-full max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              <i className="ri-shopping-bag-3-line text-primary text-3xl mb-2 block"></i>
              Entre no CIP Shopee
            </DialogTitle>
          </DialogHeader>

          {authMethod === 'email' ? (
            <div className="space-y-4">
              <EmailAuth onSuccess={() => {
                setLoginModalOpen(false);
                window.location.href = "/dashboard";
              }} />
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setAuthMethod('replit')}
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Outras opções de login
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Opção 1: Entrar com Gmail (Replit Auth por trás) */}
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <i className="ri-google-fill mr-3 text-lg"></i>
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">Continuar com Google</span>
                        <span className="text-xs opacity-90">Login rápido e seguro</span>
                      </div>
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  🚀 Método mais rápido • Sem senhas • Recomendado
                </p>
              </div>

              {/* Divisor */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground font-medium">
                    ou use
                  </span>
                </div>
              </div>

              {/* Opção 2: Email/Senha */}
              <Button 
                onClick={() => setAuthMethod('email')}
                variant="outline"
                className="w-full h-12 border-2 hover:bg-gray-50"
                disabled={isLoading}
              >
                <i className="ri-mail-line mr-3 text-lg"></i>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Email e Senha</span>
                  <span className="text-xs text-muted-foreground">Login tradicional</span>
                </div>
              </Button>

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  <i className="ri-shield-check-line mr-1"></i>
                  Seus dados estão protegidos e criptografados
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}