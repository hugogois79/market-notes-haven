import { useState } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldOff, Smartphone, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MFAEnrollment } from "./MFAEnrollment";

export const MFASettings = () => {
  const { isEnrolled, isLoading, factors, unenroll, refreshFactors } = useMFA();
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  const verifiedFactor = factors.find((f) => f.status === "verified");

  const handleUnenroll = async () => {
    if (!verifiedFactor) return;

    setIsUnenrolling(true);
    await unenroll(verifiedFactor.id);
    setIsUnenrolling(false);
  };

  const handleEnrollSuccess = async () => {
    await refreshFactors();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnrolled ? (
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              ) : (
                <ShieldOff className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-lg">Autenticação de Dois Fatores (2FA)</CardTitle>
                <CardDescription>
                  Proteja a sua conta com um código temporário adicional.
                </CardDescription>
              </div>
            </div>
            <Badge variant={isEnrolled ? "default" : "secondary"}>
              {isEnrolled ? "Ativado" : "Desativado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnrolled && verifiedFactor ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {verifiedFactor.friendly_name || "Authenticator App"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Configurado em{" "}
                    {new Date(verifiedFactor.created_at).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desativar Autenticação de Dois Fatores?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá remover a proteção adicional da sua conta. Poderá reativar a
                        qualquer momento.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleUnenroll}
                        disabled={isUnenrolling}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isUnenrolling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            A remover...
                          </>
                        ) : (
                          "Desativar 2FA"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <p className="text-sm text-muted-foreground">
                A sua conta está protegida. Será necessário um código da app de autenticação para
                fazer login.
              </p>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta,
                  exigindo um código temporário além da sua password.
                </p>

                <div className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">Apps compatíveis:</span>
                  <span>Google Authenticator, Microsoft Authenticator, Authy</span>
                </div>
              </div>

              <Button onClick={() => setEnrollDialogOpen(true)}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Configurar 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <MFAEnrollment
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        onSuccess={handleEnrollSuccess}
      />
    </>
  );
};

export default MFASettings;
