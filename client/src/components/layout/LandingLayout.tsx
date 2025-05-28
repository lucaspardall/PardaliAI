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

  const handleLoginWithReplit = async () => {
    setIsLoading(true);
    window.open('/api/login', '_blank', 'width=600,height=600');
    setIsLoading(false);
  };

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

          {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-4">
                  <Button variant="ghost" onClick={openLoginModal}>
                    Entrar
                  </Button>
                  <Button onClick={openLoginModal}>
                    Comece grátis
                  </Button>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-4">
                  <Button variant="ghost" onClick={openLoginModal}>
                    Entrar
                  </Button>
                  <Button onClick={openLoginModal}>
                    Comece grátis
                  </Button>
                </div>
              )}

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2 border-primary hover:bg-primary/10"
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

              {isAuthenticated ? (
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/dashboard">
                      <i className="ri-dashboard-line mr-2"></i>
                      Ir para Dashboard
                    </Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Bem-vindo de volta!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => { openLoginModal(); setMobileMenuOpen(false); }}>
                    <i className="ri-rocket-line mr-2"></i>
                    Comece grátis
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { openLoginModal(); setMobileMenuOpen(false); }}>
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
        <DialogContent className="sm:max-w-md">
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
                variant="outline"
                className="w-full"
                onClick={() => setAuthMethod('replit')}
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Voltar para login Replit
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Opção Replit */}
              <div className="text-center space-y-4">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl border-2 border-dashed border-primary/20">
                  <i className="ri-replit-line text-4xl text-primary mb-3 block"></i>
                  <h3 className="font-semibold text-lg mb-2">Login com Replit</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rápido, seguro e sem necessidade de criar nova senha
                  </p>

                  <div className="space-y-3">
                    <Button 
                      onClick={handleLoginWithReplit} 
                      disabled={isLoading}
                      className="w-full bg-[#0E1525] hover:bg-[#1C2333] text-white"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <i className="ri-replit-line mr-2"></i>
                          Replit (Pop-up)
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={() => window.location.href = "/api/login"}
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                    >
                      <i className="ri-replit-fill mr-2"></i>
                      Replit (Redirecionamento)
                    </Button>
                  </div>
                </div>

                {/* Divisor */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      ou
                    </span>
                  </div>
                </div>

                {/* Opção Email */}
                <Button 
                  onClick={() => setAuthMethod('email')}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  <i className="ri-mail-line mr-2"></i>
                  Entrar com Email e Senha
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}