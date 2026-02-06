import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBankPayment } from "@/hooks/useBankPayment";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, Landmark } from "lucide-react";
import { format } from "date-fns";

interface BankPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentUrl: string;
  fileName: string;
  vendorName?: string | null;
  totalAmount?: number | null;
}

export default function BankPaymentDialog({
  open,
  onOpenChange,
  documentId,
  documentUrl,
  fileName,
  vendorName,
  totalAmount,
}: BankPaymentDialogProps) {
  const { sendPayment, isSending, result, reset } = useBankPayment();

  // Form state
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryIban, setBeneficiaryIban] = useState("");
  const [amount, setAmount] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [executionDate, setExecutionDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Fetch active bank accounts
  const { data: bankAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["bank-accounts-for-payment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, account_name, account_number, company:companies(id, name)")
        .eq("is_active", true)
        .order("account_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Pre-fill form when dialog opens
  useEffect(() => {
    if (open) {
      setBeneficiaryName(vendorName || "");
      setBeneficiaryIban("");
      setAmount(totalAmount?.toString() || "");
      setReference(fileName || "");
      setExecutionDate(format(new Date(), "yyyy-MM-dd"));
      setSourceAccountId("");
      reset();
    }
  }, [open, vendorName, totalAmount, fileName, reset]);

  const handleSubmit = async () => {
    // Validation
    if (!beneficiaryName.trim() || beneficiaryName.length < 2) {
      toast.error("Preencha o nome do beneficiário (mínimo 2 caracteres)");
      return;
    }
    if (!beneficiaryIban.trim()) {
      toast.error("Preencha o IBAN do beneficiário");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("O montante deve ser maior que 0");
      return;
    }
    if (!sourceAccountId) {
      toast.error("Selecione uma conta de origem");
      return;
    }
    if (!reference.trim()) {
      toast.error("Preencha a referência");
      return;
    }

    const response = await sendPayment({
      beneficiaryName: beneficiaryName.trim(),
      beneficiaryIban: beneficiaryIban.trim().replace(/\s/g, ""),
      amount: amountNum,
      currency: "EUR",
      sourceAccountId,
      reference: reference.trim(),
      executionDate,
      documentId,
      documentUrl,
    });

    if (response.success) {
      toast.success("Pagamento enviado com sucesso!");
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } else {
      toast.error(response.error || "Erro ao enviar pagamento");
    }
  };

  const formatIban = (iban: string) => {
    // Format IBAN with spaces every 4 characters
    return iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
  };

  const selectedAccount = bankAccounts?.find((a) => a.id === sourceAccountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Pagar Banco
          </DialogTitle>
          <DialogDescription>
            Iniciar transferência bancária direta via Wise
          </DialogDescription>
        </DialogHeader>

        {result?.success ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-primary">
                Pagamento Enviado!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {result.message || "A transferência foi iniciada com sucesso."}
              </p>
              {result.transferId && (
                <p className="text-xs text-muted-foreground mt-2">
                  ID: {result.transferId}
                </p>
              )}
            </div>
          </div>
        ) : result?.error ? (
          <div className="py-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Erro ao enviar pagamento</h4>
                <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
              </div>
            </div>
            <Button variant="outline" onClick={reset} className="w-full">
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Beneficiary Name */}
              <div className="space-y-2">
                <Label htmlFor="beneficiaryName">Beneficiário *</Label>
                <Input
                  id="beneficiaryName"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="Nome do beneficiário"
                />
              </div>

              {/* Beneficiary IBAN */}
              <div className="space-y-2">
                <Label htmlFor="beneficiaryIban">IBAN do Beneficiário *</Label>
                <Input
                  id="beneficiaryIban"
                  value={beneficiaryIban}
                  onChange={(e) => setBeneficiaryIban(e.target.value)}
                  placeholder="PT50 0000 0000 0000 0000 0000 0"
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Montante (EUR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Source Account */}
              <div className="space-y-2">
                <Label htmlFor="sourceAccount">Conta de Origem *</Label>
                <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                  <SelectTrigger id="sourceAccount">
                    <SelectValue placeholder={isLoadingAccounts ? "A carregar..." : "Selecione uma conta"} />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {account.company?.name} - {account.account_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatIban(account.account_number)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAccount && (
                  <p className="text-xs text-muted-foreground">
                    IBAN: {formatIban(selectedAccount.account_number)}
                  </p>
                )}
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label htmlFor="reference">Referência *</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Descrição do pagamento"
                />
              </div>

              {/* Execution Date */}
              <div className="space-y-2">
                <Label htmlFor="executionDate">Data de Execução</Label>
                <Input
                  id="executionDate"
                  type="date"
                  value={executionDate}
                  onChange={(e) => setExecutionDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    A enviar...
                  </>
                ) : (
                  <>
                    <Landmark className="h-4 w-4 mr-2" />
                    Enviar Pagamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
