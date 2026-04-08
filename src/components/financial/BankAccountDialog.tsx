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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface BankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
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
  const [selectedCompany, setSelectedCompany] = useState(companyId || "");
  const [accountType, setAccountType] = useState<string>("bank_account");

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (account) {
      reset(account);
      setSelectedCompany(account.company_id);
      setAccountType(account.account_type || "bank_account");
    } else {
      reset({
        currency: "EUR",
        is_active: true,
        initial_balance: 0,
      });
      setSelectedCompany(companyId || "");
      setAccountType("bank_account");
    }
  }, [account, companyId, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedCompany) {
        throw new Error("Please select a company");
      }

      const accountData = {
        ...data,
        company_id: selectedCompany,
        account_type: accountType,
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
      queryClient.invalidateQueries({ 
        queryKey: ["bank-accounts"],
        refetchType: 'all'
      });
      toast.success(account ? "Conta atualizada" : "Conta criada");
      onOpenChange(false);
      reset();
      setSelectedCompany(companyId || "");
      setAccountType("bank_account");
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {account 
              ? "Editar Conta" 
              : accountType === "credit_card" 
                ? "Novo Cartão de Crédito" 
                : "Nova Conta Bancária"
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Tipo *</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_account">Conta Bancária</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Empresa *</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{accountType === "credit_card" ? "Nome do Cartão *" : "Nome da Conta *"}</Label>
            <Input 
              {...register("account_name", { required: true })} 
              placeholder={accountType === "credit_card" ? "Ex: Visa Business" : "Conta Principal"} 
            />
          </div>

          <div>
            <Label>{accountType === "credit_card" ? "Emissor" : "Banco"}</Label>
            <Input 
              {...register("bank_name")} 
              placeholder={accountType === "credit_card" ? "Ex: American Express" : "Ex: Millennium BCP"} 
            />
          </div>

          <div>
            <Label>{accountType === "credit_card" ? "Últimos 4 dígitos *" : "IBAN / Nº Conta *"}</Label>
            <Input 
              {...register("account_number", { required: true })} 
              placeholder={accountType === "credit_card" ? "1234" : "PT50..."} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{accountType === "credit_card" ? "Plafond" : "Saldo Inicial"}</Label>
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
              {accountType === "credit_card" ? "Cartão ativo" : "Conta ativa"}
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || !selectedCompany}>
              {saveMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
