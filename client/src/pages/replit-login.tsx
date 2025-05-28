
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Zap, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function ReplitLoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'idle' | 'opening' | 'authenticating' | 'redirecting'>('idle');

  const handleLoginWithReplit = () => {
    setIsLoading(true);
    setLoginStep('opening');

    toast({
      title: "🚀 Iniciando autenticação",
      description: "Abrindo janela segura do Replit...",
    });

    window.addEventListener("message", authComplete);
    const h = 650;
    const w = 450;
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

    if (!authWindow) {
      setIsLoading(false);
      setLoginStep('idle');
      toast({
        title: "❌ Popup bloqueado",
        description: "Permita popups para este site e tente novamente.",
        variant: "destructive"
      });
      return;
    }

    setLoginStep('authenticating');

    // Timeout com feedback progressivo
    const timeoutId = setTimeout(() => {
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
      setIsLoading(false);
      setLoginStep('idle');
      window.removeEventListener("message", authComplete);
      toast({
        title: "⏰ Tempo limite excedido",
        description: "Tente fazer login novamente.",
        variant: "destructive"
      });
    }, 45000);

    function authComplete(e: MessageEvent) {
      if (e.data !== "auth_complete") {
        return;
      }

      clearTimeout(timeoutId);
      setLoginStep('redirecting');
      window.removeEventListener("message", authComplete);

      if (authWindow) {
        authWindow.close();
      }

      toast({
        title: "✅ Autenticação realizada!",
        description: "Redirecionando para o dashboard...",
      });

      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1800);
    }
  };

  const getStepIcon = () => {
    switch (loginStep) {
      case 'opening':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'authenticating':
        return <Shield className="h-5 w-5 animate-pulse text-orange-500" />;
      case 'redirecting':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepText = () => {
    switch (loginStep) {
      case 'opening':
        return "Abrindo janela de autenticação...";
      case 'authenticating':
        return "Aguardando confirmação no Replit...";
      case 'redirecting':
        return "Login realizado! Redirecionando...";
      default:
        return "Pronto para fazer login";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo e Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <i className="ri-bird-fill text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            CIP Shopee
          </h1>
          <p className="text-gray-600">Entre na sua conta para continuar</p>
        </div>

        {/* Card Principal */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Fazer Login</CardTitle>
            <CardDescription>
              Autenticação segura via Replit
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            
            {/* Status do Login */}
            <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
              {getStepIcon()}
              <span className="text-sm font-medium text-gray-700">
                {getStepText()}
              </span>
            </div>

            {/* Botão Principal */}
            <Button 
              onClick={handleLoginWithReplit}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {loginStep === 'redirecting' ? 'Redirecionando...' : 'Autenticando...'}
                </>
              ) : (
                <>
                  <i className="ri-replit-fill mr-2 text-lg"></i>
                  Entrar com Replit
                </>
              )}
            </Button>

            {/* Informações de Segurança */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Autenticação 100% segura</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Acesso instantâneo ao dashboard</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span>Otimize produtos com IA</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-4 border-t">
            <div className="w-full text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                ← Voltar para página inicial
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Dicas de Uso */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-blue-900">Primeira vez aqui?</h4>
                <p className="text-xs text-blue-700">
                  Após o login, você poderá conectar sua loja Shopee e começar a otimizar produtos imediatamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
