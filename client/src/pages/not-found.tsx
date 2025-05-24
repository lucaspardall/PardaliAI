
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function NotFound() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Redirecionamento automático após 5 segundos
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/dashboard";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold">404 - Página Não Encontrada</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              Redirecionando para o dashboard em {countdown} segundos...
            </p>
            
            <div className="flex gap-3 mt-2">
              <Button asChild variant="default">
                <Link href="/dashboard">Ir para Dashboard</Link>
              </Button>
              
              <Button asChild variant="outline">
                <Link href="/">Voltar à Página Inicial</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
