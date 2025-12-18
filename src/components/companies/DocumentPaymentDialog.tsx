import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";

interface DocumentPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowFileId: string;
  fileName: string;
  existingTransaction?: any;
}

export default function DocumentPaymentDialog({
  open,
  onOpenChange,
  workflowFileId,
  fileName,
  existingTransaction,
}: DocumentPaymentDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      amount: existingTransaction?.total_amount || '',
      bank_account_id: '',
      notes: '',
    }
  });

  // Fetch all bank accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ["all-bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select(`
          *,
          company:companies(id, name)
        `)
        .eq("is_active", true)
        .order("account_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        payment_date: new Date().toISOString().split('T')[0],
        amount: existingTransaction?.total_amount || '',
        bank_account_id: existingTransaction?.bank_account_id || '',
        notes: '',
      });
    }
  }, [open, existingTransaction, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get bank account details
      const bankAccount = bankAccounts?.find(ba => ba.id === data.bank_account_id);
      if (!bankAccount) throw new Error("Conta bancária não encontrada");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Utilizador não autenticado");

      const transactionData = {
        company_id: bankAccount.company_id,
        type: 'expense' as const,
        category: 'services' as const,
        date: data.payment_date,
        description: `Pagamento: ${fileName}`,
        entity_name: existingTransaction?.entity_name || 'Fornecedor',
        total_amount: Number(data.amount),
        amount_net: Number(data.amount),
        vat_amount: 0,
        vat_rate: 0,
        payment_method: bankAccount.account_type === 'credit_card' ? 'credit_card' as const : 'bank_transfer' as const,
        bank_account_id: data.bank_account_id,
        notes: data.notes || null,
        created_by: userData.user.id,
      };

      const { error } = await supabase
        .from("financial_transactions")
        .insert(transactionData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["all-bank-accounts"] });
      toast.success("Pagamento registado com sucesso");
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const selectedBankAccountId = watch("bank_account_id");
  const selectedBankAccount = bankAccounts?.find(ba => ba.id === selectedBankAccountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registar Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Documento</Label>
            <p className="text-sm font-medium truncate">{fileName}</p>
          </div>

          <div>
            <Label>Data do Pagamento *</Label>
            <Input type="date" {...register("payment_date", { required: true })} />
          </div>

          <div>
            <Label>Montante (€) *</Label>
            <Input 
              type="number" 
              step="0.01" 
              {...register("amount", { required: true })} 
              placeholder="0.00"
            />
          </div>

          <div>
            <Label>Conta Bancária *</Label>
            <Select
              value={selectedBankAccountId}
              onValueChange={(value) => setValue("bank_account_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar conta..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {account.company?.name}
                      </span>
                      <span>{account.account_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({account.account_type === 'credit_card' ? 'Cartão' : 'Banco'})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBankAccount && (
              <p className="text-xs text-muted-foreground mt-1">
                Saldo: {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(selectedBankAccount.current_balance)}
              </p>
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea {...register("notes")} rows={2} placeholder="Notas sobre o pagamento..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "A guardar..." : "Registar Pagamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
