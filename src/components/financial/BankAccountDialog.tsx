import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useEffect } from "react";

interface BankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  account?: any;
}

export default function BankAccountDialog({
  open,
  onOpenChange,
  companyId,
  account,
}: BankAccountDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  useEffect(() => {
    if (account) {
      reset(account);
    } else {
      reset({
        currency: "EUR",
        is_active: true,
        initial_balance: 0,
      });
    }
  }, [account, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const accountData = {
        ...data,
        company_id: companyId,
        initial_balance: Number(data.initial_balance),
        current_balance: account ? Number(data.current_balance) : Number(data.initial_balance),
      };

      if (account) {
        const { error } = await supabase
          .from("bank_accounts")
          .update(accountData)
          .eq("id", account.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bank_accounts")
          .insert(accountData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", companyId] });
      toast.success(account ? "Conta atualizada" : "Conta criada");
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {account ? "Editar Conta" : "Nova Conta Bancária"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Nome da Conta *</Label>
            <Input {...register("account_name", { required: true })} placeholder="Conta Principal" />
          </div>

          <div>
            <Label>Banco</Label>
            <Input {...register("bank_name")} placeholder="Ex: Millennium BCP" />
          </div>

          <div>
            <Label>IBAN / Número da Conta *</Label>
            <Input {...register("account_number", { required: true })} placeholder="PT50..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Saldo Inicial</Label>
              <Input type="number" step="0.01" {...register("initial_balance")} />
            </div>

            <div>
              <Label>Moeda</Label>
              <Input {...register("currency")} disabled />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Conta ativa
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
