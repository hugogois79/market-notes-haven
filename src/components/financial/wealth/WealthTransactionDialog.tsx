import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type WealthTransaction = {
  id: string;
  date: string;
  counterparty: string | null;
  description: string;
  amount: number;
  transaction_type: string;
  category: string | null;
  notes: string | null;
};

type FormValues = {
  date: string;
  counterparty: string;
  description: string;
  amount: string;
  transaction_type: string;
  category: string;
  notes: string;
};

interface WealthTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: WealthTransaction | null;
}

const TRANSACTION_TYPES = [
  { value: "credit", label: "Crédito (Entrada)" },
  { value: "debit", label: "Débito (Saída)" },
];

const CATEGORIES = [
  "Investment",
  "Maintenance",
  "Personal",
  "Business",
  "Real Estate",
  "Crypto",
  "Art",
  "Vehicles",
  "Other",
];

export default function WealthTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: WealthTransactionDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!transaction;

  const form = useForm<FormValues>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      counterparty: "",
      description: "",
      amount: "",
      transaction_type: "credit",
      category: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        date: transaction.date,
        counterparty: transaction.counterparty || "",
        description: transaction.description,
        amount: Math.abs(transaction.amount).toString(),
        transaction_type: transaction.amount >= 0 ? "credit" : "debit",
        category: transaction.category || "",
        notes: transaction.notes || "",
      });
    } else {
      form.reset({
        date: new Date().toISOString().split("T")[0],
        counterparty: "",
        description: "",
        amount: "",
        transaction_type: "credit",
        category: "",
        notes: "",
      });
    }
  }, [transaction, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const amount = parseFloat(values.amount.replace(",", "."));
      const finalAmount = values.transaction_type === "debit" ? -Math.abs(amount) : Math.abs(amount);

      const payload = {
        date: values.date,
        counterparty: values.counterparty || null,
        description: values.description,
        amount: finalAmount,
        transaction_type: values.transaction_type,
        category: values.category || null,
        notes: values.notes || null,
        user_id: user.id,
      };

      if (isEditing && transaction) {
        const { error } = await supabase
          .from("wealth_transactions")
          .update(payload)
          .eq("id", transaction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wealth_transactions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wealth-transactions"] });
      toast.success(isEditing ? "Transação atualizada" : "Transação criada");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Erro ao guardar transação");
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Transação" : "Nova Transação"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                rules={{ required: "Data é obrigatória" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRANSACTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="counterparty"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Contraparte</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Juliao Sarmento, Banco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                rules={{ required: "Descrição é obrigatória" }}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Quadro Pedro Falcao, Crypto Investment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                rules={{ required: "Valor é obrigatório" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        inputMode="decimal"
                        placeholder="0,00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "A guardar..." : isEditing ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
