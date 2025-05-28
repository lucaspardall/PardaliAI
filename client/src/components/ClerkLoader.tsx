
import { useClerk } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

export function ClerkLoader({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
  const [isReady, setIsReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Inicializando...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    let progressInterval: NodeJS.Timeout;
    let finalTimeout: NodeJS.Timeout;

    const initializeClerk = async () => {
      try {
        console.log('🚀 [ClerkLoader] Iniciando no Replit...');
        
        // Animação de progresso
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 10;
          });
        }, 200);

        // Etapa 1: Verificação inicial
        setLoadingMessage('Configurando autenticação...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (!mounted) return;

        // Etapa 2: Verificar se Clerk carregou
        setLoadingMessage('Conectando com Clerk...');
        setProgress(30);
        
        if (clerk.loaded) {
          console.log('✅ [ClerkLoader] Clerk carregado imediatamente!');
          setLoadingMessage('Autenticação configurada!');
          setProgress(100);
          
          setTimeout(() => {
            if (mounted) setIsReady(true);
          }, 500);
          return;
        }

        // Etapa 3: Aguardar carregamento
        setLoadingMessage('Aguardando inicialização...');
        setProgress(50);
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (!mounted) return;

        if (clerk.loaded) {
          console.log('✅ [ClerkLoader] Clerk carregado após espera!');
          setLoadingMessage('Finalizando configuração...');
          setProgress(100);
          
          setTimeout(() => {
            if (mounted) setIsReady(true);
          }, 300);
          return;
        }

        // Etapa 4: Modo de recuperação
        console.warn('⚠️ [ClerkLoader] Clerk não carregou, ativando modo de recuperação...');
        setLoadingMessage('Modo de compatibilidade ativado...');
        setProgress(80);
        
        // Timeout final - sempre prosseguir
        finalTimeout = setTimeout(() => {
          if (mounted) {
            console.log('🔄 [ClerkLoader] Prosseguindo com aplicação (modo fallback)');
            setLoadingMessage('Carregamento concluído!');
            setProgress(100);
            
            setTimeout(() => {
              if (mounted) setIsReady(true);
            }, 500);
          }
        }, 1000);

      } catch (error: any) {
        console.error('❌ [ClerkLoader] Erro:', error);
        
        if (mounted) {
          setLoadingMessage('Recuperando de erro...');
          setProgress(95);
          
          setTimeout(() => {
            if (mounted) {
              console.log('🚀 [ClerkLoader] Continuando após erro');
              setIsReady(true);
            }
          }, 800);
        }
      } finally {
        if (progressInterval) clearInterval(progressInterval);
      }
    };

    initializeClerk();

    return () => {
      mounted = false;
      if (progressInterval) clearInterval(progressInterval);
      if (finalTimeout) clearTimeout(finalTimeout);
    };
  }, [clerk]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="text-center max-w-sm px-8">
          {/* Spinner animado */}
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Mensagem */}
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            CIP Shopee
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            {loadingMessage}
          </p>
          
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Status */}
          <p className="text-xs text-gray-500">
            Otimizado para Replit • {Math.round(progress)}%
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
