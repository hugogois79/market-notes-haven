import { useState, useEffect, useRef } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useBankPayment } from "@/hooks/useBankPayment";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, Landmark, Check, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BankPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentUrl: string;
  fileName: string;
  vendorName?: string | null;
  totalAmount?: number | null;
  description?: string | null;
}

interface WiseRecipient {
  wise_recipient_id: number;
  name: string;
  iban: string;
}

export default function BankPaymentDialog({
  open,
  onOpenChange,
  documentId,
  documentUrl,
  fileName,
  vendorName,
  totalAmount,
  description,
}: BankPaymentDialogProps) {
  const { sendPayment, isSending, result, reset } = useBankPayment();
  const hasInitialized = useRef(false);

  // Form state
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryIban, setBeneficiaryIban] = useState("");
  const [amount, setAmount] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [executionDate, setExecutionDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Autocomplete state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

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

  // Fetch Wise recipients for autocomplete
  const { data: wiseRecipients, isLoading: isLoadingRecipients } = useQuery({
    queryKey: ["wise-recipients", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const { data, error } = await supabase
        .from("wise_recipients")
        .select("wise_recipient_id, name, iban")
        .eq("is_active", true)
        .ilike("name", `%${searchTerm}%`)
        .limit(10);
      if (error) throw error;
      return data as WiseRecipient[];
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
  });

  // Fetch initial match for vendorName
  const { data: initialMatch } = useQuery({
    queryKey: ["wise-recipients-initial", vendorName],
    queryFn: async () => {
      if (!vendorName || vendorName.length < 2) return null;
      const { data, error } = await supabase
        .from("wise_recipients")
        .select("wise_recipient_id, name, iban")
        .eq("is_active", true)
        .ilike("name", `%${vendorName}%`)
        .limit(5);
      if (error) throw error;
      return (data as WiseRecipient[])?.[0] || null;
    },
    enabled: open && !!vendorName && vendorName.length >= 2,
  });

  // Pre-fill form ONLY when dialog opens
  useEffect(() => {
    if (open && !hasInitialized.current) {
      setBeneficiaryName(vendorName || "");
      setAmount(totalAmount?.toString() || "");
      // Use description if available, otherwise fallback to fileName
      setReference(description || fileName || "");
      setExecutionDate(format(new Date(), "yyyy-MM-dd"));
      setSourceAccountId("");
      setSearchTerm(vendorName || "");
      setSelectedRecipientId(null);
      setBeneficiaryIban("");
      reset();
      hasInitialized.current = true;
    } else if (!open) {
      hasInitialized.current = false;
      setSearchTerm("");
      setPopoverOpen(false);
    }
  }, [open, vendorName, totalAmount, fileName, description, reset]);

  // Auto-fill when initial match is found
  useEffect(() => {
    if (open && initialMatch && hasInitialized.current && !selectedRecipientId) {
      setSelectedRecipientId(initialMatch.wise_recipient_id);
      setBeneficiaryIban(initialMatch.iban);
      setBeneficiaryName(initialMatch.name);
      setSearchTerm(initialMatch.name);
    }
  }, [open, initialMatch, selectedRecipientId]);

  const handleSelectRecipient = (recipient: WiseRecipient) => {
    setBeneficiaryName(recipient.name);
    setBeneficiaryIban(recipient.iban);
    setSelectedRecipientId(recipient.wise_recipient_id);
    setSearchTerm(recipient.name);
    setPopoverOpen(false);
  };

  const handleBeneficiaryChange = (value: string) => {
    setBeneficiaryName(value);
    setSearchTerm(value);
    setSelectedRecipientId(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!beneficiaryName.trim() || beneficiaryName.length < 2) {
      toast.error("Preencha o nome do beneficiário (mínimo 2 caracteres)");
      return;
    }
    // IBAN required only if no recipientId
    if (!selectedRecipientId && !beneficiaryIban.trim()) {
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
      recipientId: selectedRecipientId,
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

  const formatIban = (iban: string | null | undefined) => {
    if (!iban) return "";
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
          result?.funding?.status === 'pending_user_approval' ? (
            // Estado: Aguarda Aprovação PSD2/SCA
            <div className="py-6 space-y-4">
              <div className="text-center space-y-2">
                <Clock className="h-14 w-14 text-amber-500 mx-auto" />
                <h3 className="text-lg font-semibold text-amber-700">
                  Transferência Criada
                </h3>
                <p className="text-sm text-amber-600">
                  Aguarda Aprovação no Wise
                </p>
              </div>

              {/* Detalhes do pagamento */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Beneficiário:</span>
                  <span className="font-medium">{result.payment?.beneficiary || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montante:</span>
                  <span className="font-medium">€{result.payment?.amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Referência:</span>
                  <span className="font-medium truncate max-w-[200px]">{result.payment?.reference || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID Transfer:</span>
                  <span className="font-mono text-xs">{result.payment?.transferId || '-'}</span>
                </div>
              </div>

              {/* Mensagem de instrução */}
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {result.funding?.message || 'Aprove o pagamento na app Wise (requisito PSD2/SCA).'}
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-2">
                <Button asChild className="flex-1">
                  <a href="https://wise.com/user/account" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Wise
                  </a>
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            // Estado: Sucesso Total
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Pagamento Enviado!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.message || "A transferência foi iniciada com sucesso."}
                </p>
                {(result.transferId || result.payment?.transferId) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ID: {result.transferId || result.payment?.transferId}
                  </p>
                )}
              </div>
            </div>
          )
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
              {/* Beneficiary Name with Autocomplete */}
              <div className="space-y-2">
                <Label htmlFor="beneficiaryName">Beneficiário *</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        id="beneficiaryName"
                        type="text"
                        autoComplete="off"
                        value={beneficiaryName}
                        onChange={(e) => handleBeneficiaryChange(e.target.value)}
                        onFocus={() => setPopoverOpen(true)}
                        placeholder="Nome do beneficiário"
                        className="bg-background"
                      />
                    </div>
                  </PopoverTrigger>
                  {searchTerm.length >= 2 && (
                    <PopoverContent 
                      className="w-[--radix-popover-trigger-width] p-0" 
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <Command>
                        <CommandList>
                          {isLoadingRecipients && (
                            <CommandEmpty>A carregar...</CommandEmpty>
                          )}
                          {!isLoadingRecipients && (!wiseRecipients || wiseRecipients.length === 0) && (
                            <CommandEmpty>Sem resultados no Wise</CommandEmpty>
                          )}
                          {wiseRecipients && wiseRecipients.length > 0 && (
                            <CommandGroup heading="Recipients Wise">
                              {wiseRecipients.map((recipient) => (
                                <CommandItem
                                  key={recipient.wise_recipient_id}
                                  value={recipient.name}
                                  onSelect={() => handleSelectRecipient(recipient)}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedRecipientId === recipient.wise_recipient_id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col flex-1">
                                    <span className="font-medium">{recipient.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatIban(recipient.iban)}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  )}
                </Popover>
                {selectedRecipientId && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Recipient Wise confirmado
                  </p>
                )}
              </div>

              {/* Beneficiary IBAN */}
              <div className="space-y-2">
                <Label htmlFor="beneficiaryIban">
                  IBAN do Beneficiário {selectedRecipientId ? "(opcional)" : "*"}
                </Label>
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
