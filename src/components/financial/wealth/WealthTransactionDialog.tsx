import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  currency?: string | null;
  project_id?: string | null;
  asset_id?: string | null;
};

type FormValues = {
  date: string;
  counterparty: string;
  description: string;
  amount: string;
  transaction_type: string;
  category: string;
  notes: string;
  currency: string;
  project_id: string;
  asset_id: string;
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

const CURRENCIES = [
  { value: "EUR", label: "EUR €", symbol: "€" },
  { value: "USD", label: "USD $", symbol: "$" },
  { value: "GBP", label: "GBP £", symbol: "£" },
  { value: "CHF", label: "CHF", symbol: "CHF" },
  { value: "BTC", label: "BTC ₿", symbol: "₿" },
  { value: "USDT", label: "USDT", symbol: "USDT" },
];

// Format number with Portuguese convention (spaces for thousands, comma for decimals)
const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters except comma and dot
  let cleaned = value.replace(/[^\d,.-]/g, "");
  
  // Replace dot with comma for consistency
  cleaned = cleaned.replace(".", ",");
  
  // Split by comma
  const parts = cleaned.split(",");
  
  // Format integer part with spaces
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
  
  // Join back with comma, limit to 2 decimal places
  if (parts.length > 1) {
    return parts[0] + "," + parts[1].slice(0, 2);
  }
  
  return parts[0];
};

// Parse formatted string back to number
const parseCurrencyInput = (value: string): number => {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
};

export default function WealthTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: WealthTransactionDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!transaction;

  const { data: assets = [] } = useQuery({
    queryKey: ["wealth-assets-for-transactions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("wealth_assets")
        .select("id, name, category")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<FormValues>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      counterparty: "",
      description: "",
      amount: "",
      transaction_type: "credit",
      category: "",
      notes: "",
      currency: "EUR",
      project_id: "",
      asset_id: "",
    },
  });

  const selectedCurrency = form.watch("currency");
  const currencySymbol = CURRENCIES.find(c => c.value === selectedCurrency)?.symbol || "€";

  useEffect(() => {
    if (transaction) {
      const formattedAmount = Math.abs(transaction.amount).toLocaleString("pt-PT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      form.reset({
        date: transaction.date,
        counterparty: transaction.counterparty || "",
        description: transaction.description,
        amount: formattedAmount,
        transaction_type: transaction.amount >= 0 ? "credit" : "debit",
        category: transaction.category || "",
        notes: transaction.notes || "",
        currency: transaction.currency || "EUR",
        project_id: transaction.project_id || "",
        asset_id: transaction.asset_id || "",
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
        currency: "EUR",
        project_id: "",
        asset_id: "",
      });
    }
  }, [transaction, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const amount = parseCurrencyInput(values.amount);
      const finalAmount = values.transaction_type === "debit" ? -Math.abs(amount) : Math.abs(amount);

      const payload = {
        date: values.date,
        counterparty: values.counterparty || null,
        description: values.description,
        amount: finalAmount,
        transaction_type: values.transaction_type,
        category: values.category || null,
        notes: values.notes || null,
        currency: values.currency,
        project_id: values.project_id || null,
        asset_id: values.asset_id || null,
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const formatted = formatCurrencyInput(e.target.value);
    onChange(formatted);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Transação" : "Nova Transação"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                rules={{ required: "Data é obrigatória" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Data</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-8 text-sm" {...field} />
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
                    <FormLabel className="text-xs">Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-sm">
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
                    <FormLabel className="text-xs">Contraparte</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" placeholder="Ex: Juliao Sarmento, Banco" {...field} />
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
                    <FormLabel className="text-xs">Descrição</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" placeholder="Ex: Quadro Pedro Falcao, Crypto Investment" {...field} />
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
                    <FormLabel className="text-xs">Valor</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          className="h-8 text-sm pr-12"
                          value={field.value}
                          onChange={(e) => handleAmountChange(e, field.onChange)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {currencySymbol}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Moeda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
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
                name="asset_id"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-xs">Ativo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name}
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
                    <FormLabel className="text-xs">Notas</FormLabel>
                    <FormControl>
                      <Textarea className="text-sm min-h-[60px]" placeholder="Observações..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending ? "A guardar..." : isEditing ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
