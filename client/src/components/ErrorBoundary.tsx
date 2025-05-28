
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-destructive">
                <i className="ri-error-warning-line text-2xl mb-2 block"></i>
                Algo deu errado
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Ocorreu um erro inesperado. Por favor, recarregue a página.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Recarregar página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-destructive">
          <i className="ri-error-warning-line text-2xl mb-2 block"></i>
          Erro na aplicação
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-2">
          {error.message}
        </p>
        <details className="text-xs text-muted-foreground mb-4">
          <summary>Detalhes técnicos</summary>
          <pre className="mt-2 text-left overflow-auto">
            {error.stack}
          </pre>
        </details>
        <Button onClick={resetErrorBoundary} className="w-full">
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  </div>
);
