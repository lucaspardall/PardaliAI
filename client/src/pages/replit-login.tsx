import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Zap, TrendingUp } from 'lucide-react';

export default function ReplitLoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginWithReplit = () => {
    setIsLoading(true);

    window.addEventListener("message", authComplete);
    const h = 500;
    const w = 350;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    const authWindow = window.open(
      "https://replit.com/auth_with_repl_site?domain=" + location.host,
      "_blank",
      "modal=yes, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" +
        w +
        ", height=" +
        h +
        ", top=" +
        top +
        ", left=" +
        left
    );

    function authComplete(e: MessageEvent) {
      if (e.data !== "auth_complete") {
        return;
      }

      setIsLoading(false);
      window.removeEventListener("message", authComplete);

      if (authWindow) {
        authWindow.close();
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      });

      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    }
  };

  const handleDirectLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/10 via-red-100/10 to-pink-100/10"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6 shadow-2xl">
            <i className="ri-shopping-bag-3-line text-3xl text-white"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            CIP Shopee
          </h1>
          <p className="text-gray-600 text-lg font-medium">Centro de Inteligência Pardal</p>
          <p className="text-gray-500 text-sm mt-2">Otimize suas vendas com Inteligência Artificial</p>
        </div>

        {/* Card Principal */}
        <Card className="bg-white/80 backdrop-blur-lg shadow-2xl border-0 rounded-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">Bem-vindo de volta!</CardTitle>
            <CardDescription className="text-gray-600">
              Faça login para acessar sua plataforma de otimização Shopee
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Features em destaque */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-xs font-medium text-gray-700">IA Avançada</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-xs font-medium text-gray-700">Analytics</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-gray-700">Seguro</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-500 font-medium">Login Seguro</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-0">
            <Button 
              onClick={handleLoginWithReplit} 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <i className="ri-replit-line mr-2 text-lg"></i>
                  Entrar com Replit
                </>
              )}
            </Button>

            <Button 
              onClick={handleDirectLogin}
              variant="outline"
              className="w-full border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 font-semibold py-3 rounded-xl transition-all duration-200"
              disabled={isLoading}
            >
              <i className="ri-login-box-line mr-2"></i>
              Login Direto
            </Button>
          </CardFooter>
        </Card>

        {/* Estatísticas */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Confiado por vendedores Shopee</p>
          <div className="flex justify-center space-x-8 text-sm">
            <div>
              <p className="font-bold text-orange-600 text-lg">1000+</p>
              <p className="text-gray-600">Produtos Otimizados</p>
            </div>
            <div>
              <p className="font-bold text-green-600 text-lg">85%</p>
              <p className="text-gray-600">Aumento Médio</p>
            </div>
            <div>
              <p className="font-bold text-blue-600 text-lg">24/7</p>
              <p className="text-gray-600">Monitoramento</p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Ao fazer login, você concorda com nossos Termos de Serviço</p>
        </div>
      </div>
    </div>
  );
}