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

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  transaction?: any;
}

export default function TransactionDialog({
  open,
  onOpenChange,
  companyId,
  transaction,
}: TransactionDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  // Use expense_projects instead of financial_projects (same as expenses module)
  const { data: expenseProjects } = useQuery({
    queryKey: ["expense-projects-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Get expense categories (same as expenses module)
  const { data: expenseCategories } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const transactionType = watch("type");

  useEffect(() => {
    if (transaction) {
      reset({
        ...transaction,
        category_id: transaction.category_id || "",
      });
    } else {
      reset({
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: 'other',
        category_id: "",
        payment_method: 'bank_transfer',
        vat_rate: 23,
      });
    }
  }, [transaction, reset]);

  const amountNet = watch("amount_net");
  const vatRate = watch("vat_rate");

  useEffect(() => {
    if (amountNet && vatRate !== undefined) {
      const net = Number(amountNet);
      const rate = Number(vatRate);
      const vatAmount = net * (rate / 100);
      const total = net + vatAmount;
      
      setValue("vat_amount", vatAmount.toFixed(2));
      setValue("total_amount", total.toFixed(2));
    }
  }, [amountNet, vatRate, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const transactionData = {
        ...data,
        company_id: companyId,
        created_by: user?.id,
        amount_net: Number(data.amount_net),
        vat_rate: Number(data.vat_rate),
        vat_amount: Number(data.vat_amount),
        total_amount: Number(data.total_amount),
        project_id: data.project_id || null,
        category_id: data.category_id || null,
        // Keep default category for the enum field (required)
        category: 'other',
      };

      if (transaction) {
        const { error } = await supabase
          .from("financial_transactions")
          .update(transactionData)
          .eq("id", transaction.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financial_transactions")
          .insert(transactionData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", companyId] });
      queryClient.invalidateQueries({ queryKey: ["transactions-dashboard", companyId] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts-dashboard", companyId] });
      toast.success(transaction ? "Movimento atualizado" : "Movimento criado");
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar Movimento" : "Novo Movimento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data *</Label>
              <Input type="date" {...register("date", { required: true })} />
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select onValueChange={(value) => setValue("type", value)} defaultValue={watch("type")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select 
                onValueChange={(value) => setValue("category_id", value)} 
                value={watch("category_id") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories
                    ?.filter(cat => {
                      // Filter categories based on transaction type
                      if (transactionType === 'income') {
                        return cat.category_type === 'receita' || cat.category_type === 'ambos';
                      }
                      return cat.category_type === 'despesa' || cat.category_type === 'ambos';
                    })
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subcategoria</Label>
              <Input {...register("subcategory")} placeholder="Ex: Marketing" />
            </div>
          </div>

          <div>
            <Label>Descrição *</Label>
            <Input {...register("description", { required: true })} />
          </div>

          <div>
            <Label>Fornecedor/Cliente *</Label>
            <Input {...register("entity_name", { required: true })} placeholder="Nome da empresa/pessoa" />
          </div>


          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Valor (s/ IVA) *</Label>
              <Input type="number" step="0.01" {...register("amount_net", { required: true })} />
            </div>

            <div>
              <Label>Taxa IVA (%)</Label>
              <Input type="number" step="0.01" {...register("vat_rate")} />
            </div>

            <div>
              <Label>IVA (€)</Label>
              <Input type="number" step="0.01" {...register("vat_amount")} readOnly />
            </div>
          </div>

          <div>
            <Label>Total (c/ IVA) *</Label>
            <Input type="number" step="0.01" {...register("total_amount")} readOnly className="font-bold" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Método de Pagamento *</Label>
              <Select onValueChange={(value) => setValue("payment_method", value)} defaultValue={watch("payment_method")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="mbway">MBWay</SelectItem>
                  <SelectItem value="multibanco">Multibanco</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Conta Bancária</Label>
              <Select onValueChange={(value) => setValue("bank_account_id", value)} defaultValue={watch("bank_account_id")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nº Fatura/Recibo</Label>
              <Input {...register("invoice_number")} placeholder="FT 2024/001" />
            </div>

            <div>
              <Label>Projeto</Label>
              <Select 
                onValueChange={(value) => setValue("project_id", value === "none" ? null : value)} 
                value={watch("project_id") || "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem projeto</SelectItem>
                  {expenseProjects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea {...register("notes")} rows={3} />
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
