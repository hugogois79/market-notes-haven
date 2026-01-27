import { useState, useEffect } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";

interface MFAVerificationProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const MFAVerification = ({ onSuccess, onCancel }: MFAVerificationProps) => {
  const { verifyChallenge, createChallenge, refreshFactors, isLoading: mfaLoading } = useMFA();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      setIsInitializing(true);
      await refreshFactors();
      // Small delay to ensure factors are loaded before creating challenge
      if (mounted) {
        // Wait for factors to be available
        setTimeout(async () => {
          if (mounted) {
            await createChallenge();
            setIsInitializing(false);
          }
        }, 100);
      }
    };
    init();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setIsVerifying(true);
    const success = await verifyChallenge(code);
    setIsVerifying(false);

    if (success) {
      onSuccess();
    } else {
      setCode("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  const handleRetry = async () => {
    setCode("");
    await createChallenge();
  };

  if (isInitializing || mfaLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle>Verificação de Dois Fatores</CardTitle>
        <CardDescription>
          Insira o código de 6 dígitos da sua app de autenticação para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code" className="sr-only">
            Código de Verificação
          </Label>
          <Input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={handleKeyDown}
            className="text-center text-3xl tracking-[0.5em] font-mono h-14"
            autoComplete="one-time-code"
            autoFocus
          />
        </div>

        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={isVerifying || code.length !== 6}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A verificar...
            </>
          ) : (
            "Verificar"
          )}
        </Button>

        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Novo código
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Abra a sua app de autenticação (Google Authenticator, Authy, etc.) para obter o código.
        </p>
      </CardContent>
    </Card>
  );
};

export default MFAVerification;
