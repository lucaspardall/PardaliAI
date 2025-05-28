
import { useClerk } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

export function ClerkLoader({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
  const [isReady, setIsReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Inicializando autenticação...');

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeClerk = async () => {
      try {
        console.log('🔄 Inicializando Clerk no Replit...');
        setLoadingMessage('Conectando com servidor de autenticação...');

        // Aguardar um pouco para o Clerk tentar carregar
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!mounted) return;

        // Verificar se o Clerk carregou
        if (clerk.loaded) {
          console.log('✅ Clerk carregado com sucesso!');
          setLoadingMessage('Autenticação configurada!');
          setTimeout(() => {
            if (mounted) setIsReady(true);
          }, 500);
          return;
        }

        // Se não carregou, aguardar mais um pouco
        setLoadingMessage('Aguardando inicialização...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (!mounted) return;

        // Verificar novamente
        if (clerk.loaded) {
          console.log('✅ Clerk carregado após espera!');
          setIsReady(true);
          return;
        }

        // Se ainda não carregou, continuar mesmo assim
        console.warn('⚠️ Clerk não carregou completamente, mas continuando...');
        setLoadingMessage('Finalizando configuração...');
        
        // Timeout final de segurança
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('🚀 Prosseguindo com a aplicação (modo fallback)');
            setIsReady(true);
          }
        }, 2000);

      } catch (error: any) {
        console.error('❌ Erro durante inicialização do Clerk:', error);
        console.log('🚀 Continuando mesmo com erro...');
        
        if (mounted) {
          setLoadingMessage('Modo fallback ativado...');
          setTimeout(() => {
            if (mounted) setIsReady(true);
          }, 1000);
        }
      }
    };

    initializeClerk();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [clerk]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">{loadingMessage}</p>
          <p className="mt-2 text-sm text-gray-500">
            Otimizando para ambiente Replit...
          </p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
            <div className="bg-orange-500 h-1 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
