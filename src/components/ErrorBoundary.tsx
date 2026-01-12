import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/auth";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-8 w-8" />
              <h1 className="text-xl font-semibold">Algo correu mal</h1>
            </div>
            
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado. Por favor, tenta recarregar a página.
            </p>

            <div className="flex gap-2">
              <Button onClick={this.handleReload} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                Ir para Login
              </Button>
            </div>

            {/* Error details for development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 p-3 bg-muted rounded-md text-xs">
                <summary className="cursor-pointer font-medium text-foreground">
                  Detalhes do erro (dev)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-destructive overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
