
import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';

export default function DirectLogin() {
  const { toast } = useToast();

  const handleLoginWithReplit = () => {
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

      window.removeEventListener("message", authComplete);
      authWindow?.close();
      
      toast({
        title: "Login realizado com sucesso",
        description: "Você está conectado e pode usar o sistema agora.",
        variant: "default",
      });
      
      // Recarregar a página após login bem-sucedido
      location.reload();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Entrar no CIP Shopee</CardTitle>
        <CardDescription>
          Faça login para acessar a plataforma e integrar sua loja.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <p className="text-sm text-gray-500">
          Use sua conta do Replit para fazer login de forma rápida e segura.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleLoginWithReplit} 
          className="w-full bg-[#0E1525] hover:bg-[#1C2333] text-white"
        >
          Entrar com Replit
        </Button>
      </CardFooter>
    </Card>
  );
}
