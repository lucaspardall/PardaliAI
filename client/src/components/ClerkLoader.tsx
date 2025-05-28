
import { useClerk } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

export function ClerkLoader({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkClerk = async () => {
      try {
        // Aguardar o Clerk carregar
        if (clerk.loaded) {
          console.log('✅ Clerk carregado com sucesso no Replit');
          setIsReady(true);
        } else {
          // Timeout de segurança
          setTimeout(() => {
            if (!clerk.loaded) {
              console.warn('⚠️ Clerk demorou para carregar, prosseguindo...');
              setIsReady(true);
            }
          }, 5000);
        }
      } catch (err: any) {
        console.error('❌ Erro ao carregar Clerk:', err);
        setError(err.message);
        // Mesmo com erro, continuar (para debug)
        setIsReady(true);
      }
    };

    checkClerk();
  }, [clerk.loaded]);

  if (error) {
    console.warn('⚠️ Continuando mesmo com erro do Clerk:', error);
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando autenticação...</p>
          <p className="mt-2 text-sm text-gray-400">Configurando Clerk para Replit</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
