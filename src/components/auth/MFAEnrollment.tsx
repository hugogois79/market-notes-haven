import { useState } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Copy, Check, Smartphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface MFAEnrollmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const MFAEnrollment = ({ open, onOpenChange, onSuccess }: MFAEnrollmentProps) => {
  const { enrollmentData, startEnrollment, verifyEnrollment, cancelEnrollment } = useMFA();
  const [step, setStep] = useState<"initial" | "qrcode" | "verify">("initial");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    const result = await startEnrollment();
    setIsLoading(false);
    
    if (result) {
      setStep("qrcode");
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Insira um código de 6 dígitos");
      return;
    }

    setIsLoading(true);
    const success = await verifyEnrollment(code);
    setIsLoading(false);

    if (success) {
      setStep("initial");
      setCode("");
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleClose = () => {
    if (step !== "initial") {
      cancelEnrollment();
    }
    setStep("initial");
    setCode("");
    onOpenChange(false);
  };

  const copySecret = () => {
    if (enrollmentData?.totp.secret) {
      navigator.clipboard.writeText(enrollmentData.totp.secret);
      setSecretCopied(true);
      toast.success("Código copiado");
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  const formatSecret = (secret: string) => {
    // Format secret in groups of 4 for easier reading
    return secret.match(/.{1,4}/g)?.join(" ") || secret;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Configurar Autenticação de Dois Fatores
          </DialogTitle>
          <DialogDescription>
            Adicione uma camada extra de segurança à sua conta usando o Google Authenticator ou
            outra app compatível.
          </DialogDescription>
        </DialogHeader>

        {step === "initial" && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-8 w-8 text-muted-foreground mt-1" />
              <div>
                <h4 className="font-medium">Passo 1: Instale uma app de autenticação</h4>
                <p className="text-sm text-muted-foreground">
                  Recomendamos Google Authenticator, Microsoft Authenticator ou Authy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mt-1">
                2
              </div>
              <div>
                <h4 className="font-medium">Passo 2: Escaneie o código QR</h4>
                <p className="text-sm text-muted-foreground">
                  Use a app para escanear o código QR que será apresentado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mt-1">
                3
              </div>
              <div>
                <h4 className="font-medium">Passo 3: Confirme com um código</h4>
                <p className="text-sm text-muted-foreground">
                  Insira o código de 6 dígitos gerado pela app para ativar.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "qrcode" && enrollmentData && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <img
                  src={enrollmentData.totp.qr_code}
                  alt="QR Code para autenticação"
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Ou insira o código manualmente:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                  {formatSecret(enrollmentData.totp.secret)}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {secretCopied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={() => setStep("verify")}>
              Continuar
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">Código de Verificação</Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="one-time-code"
              />
              <p className="text-sm text-muted-foreground text-center">
                Insira o código de 6 dígitos da sua app de autenticação
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "initial" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleStart} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A gerar...
                  </>
                ) : (
                  "Começar"
                )}
              </Button>
            </>
          )}

          {step === "qrcode" && (
            <Button variant="outline" onClick={() => setStep("initial")}>
              Voltar
            </Button>
          )}

          {step === "verify" && (
            <>
              <Button variant="outline" onClick={() => setStep("qrcode")}>
                Voltar
              </Button>
              <Button onClick={handleVerify} disabled={isLoading || code.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A verificar...
                  </>
                ) : (
                  "Verificar e Ativar"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MFAEnrollment;
