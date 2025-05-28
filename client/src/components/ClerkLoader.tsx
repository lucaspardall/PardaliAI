
import { useEffect, useState } from 'react';
import { useClerk } from '@clerk/clerk-react';

export function ClerkLoader({ children }: { children: React.ReactNode }) {
  const { loaded } = useClerk();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loaded) {
      console.log('✅ Clerk carregado com sucesso');
      setIsReady(true);
    }
  }, [loaded]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
