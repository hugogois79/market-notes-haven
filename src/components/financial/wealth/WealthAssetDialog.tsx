import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

type WealthAsset = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  status: string | null;
  current_value: number | null;
  purchase_price: number | null;
  purchase_date: string | null;
  profit_loss_value: number | null;
  yield_expected: number | null;
  allocation_weight: number | null;
  target_value_6m: number | null;
  target_weight: number | null;
  vintage_year: number | null;
  currency: string | null;
  notes: string | null;
};

type FormValues = {
  name: string;
  category: string;
  subcategory: string;
  status: string;
  current_value: string;
  purchase_price: string;
  purchase_date: string;
  allocation_weight: string;
  target_value_6m: string;
  target_weight: string;
  vintage_year: string;
  currency: string;
  notes: string;
};

interface WealthAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: WealthAsset | null;
}

const CATEGORIES = [
  "Real Estate",
  "Vehicles",
  "Marine",
  "Art",
  "Watches",
  "Crypto",
  "Private Equity",
  "Cash",
  "Other",
];

const STATUSES = ["Active", "Sold", "In Recovery", "Liquidated"];
const CURRENCIES = ["EUR", "USD", "CHF", "GBP"];

const formatCurrency = (value: number | null, currency = "EUR") => {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

export default function WealthAssetDialog({
  open,
  onOpenChange,
  asset,
}: WealthAssetDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!asset;

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      category: "Real Estate",
      subcategory: "",
      status: "Active",
      current_value: "",
      purchase_price: "",
      purchase_date: "",
      allocation_weight: "",
      target_value_6m: "",
      target_weight: "",
      vintage_year: "",
      currency: "EUR",
      notes: "",
    },
  });

  // Watch values for auto-calculation
  const currentValue = useWatch({ control: form.control, name: "current_value" });
  const purchasePrice = useWatch({ control: form.control, name: "purchase_price" });
  const purchaseDate = useWatch({ control: form.control, name: "purchase_date" });
  const currency = useWatch({ control: form.control, name: "currency" });

  // Calculate P/L and Yield automatically
  const calculations = useMemo(() => {
    const cv = parseFloat(currentValue) || 0;
    const pp = parseFloat(purchasePrice) || 0;
    
    // P/L = Current Value - Purchase Price
    const pnl = cv && pp ? cv - pp : null;
    
    // Annualized Yield = ((Current Value / Purchase Price) ^ (365 / days)) - 1) * 100
    let yieldPercent: number | null = null;
    
    if (cv && pp && pp > 0 && purchaseDate) {
      const days = differenceInDays(new Date(), new Date(purchaseDate));
      if (days > 0) {
        const totalReturn = cv / pp;
        const annualizedReturn = Math.pow(totalReturn, 365 / days) - 1;
        yieldPercent = annualizedReturn * 100;
      }
    }
    
    return { pnl, yieldPercent };
  }, [currentValue, purchasePrice, purchaseDate]);

  useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name || "",
        category: asset.category || "Real Estate",
        subcategory: asset.subcategory || "",
        status: asset.status || "Active",
        current_value: asset.current_value?.toString() || "",
        purchase_price: asset.purchase_price?.toString() || "",
        purchase_date: asset.purchase_date || "",
        allocation_weight: asset.allocation_weight?.toString() || "",
        target_value_6m: asset.target_value_6m?.toString() || "",
        target_weight: asset.target_weight?.toString() || "",
        vintage_year: asset.vintage_year?.toString() || "",
        currency: asset.currency || "EUR",
        notes: asset.notes || "",
      });
    } else {
      form.reset({
        name: "",
        category: "Real Estate",
        subcategory: "",
        status: "Active",
        current_value: "",
        purchase_price: "",
        purchase_date: "",
        allocation_weight: "",
        target_value_6m: "",
        target_weight: "",
        vintage_year: "",
        currency: "EUR",
        notes: "",
      });
    }
  }, [asset, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const cv = parseFloat(values.current_value) || null;
      const pp = parseFloat(values.purchase_price) || null;
      
      // Calculate P/L
      const pnl = cv && pp ? cv - pp : null;
      
      // Calculate annualized yield
      let yieldPercent: number | null = null;
      if (cv && pp && pp > 0 && values.purchase_date) {
        const days = differenceInDays(new Date(), new Date(values.purchase_date));
        if (days > 0) {
          const totalReturn = cv / pp;
          const annualizedReturn = Math.pow(totalReturn, 365 / days) - 1;
          yieldPercent = annualizedReturn * 100;
        }
      }

      const payload = {
        name: values.name,
        category: values.category,
        subcategory: values.subcategory || null,
        status: values.status,
        current_value: cv,
        purchase_price: pp,
        purchase_date: values.purchase_date || null,
        profit_loss_value: pnl,
        yield_expected: yieldPercent,
        allocation_weight: values.allocation_weight ? parseFloat(values.allocation_weight) : null,
        target_value_6m: values.target_value_6m ? parseFloat(values.target_value_6m) : null,
        target_weight: values.target_weight ? parseFloat(values.target_weight) : null,
        vintage_year: values.vintage_year ? parseInt(values.vintage_year) : null,
        currency: values.currency,
        notes: values.notes || null,
      };

      if (isEditing && asset) {
        const { error } = await supabase
          .from("wealth_assets")
          .update(payload)
          .eq("id", asset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wealth_assets").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wealth-assets"] });
      toast.success(isEditing ? "Ativo atualizado" : "Ativo criado");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao guardar ativo");
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Ativo" : "Novo Ativo"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Nome é obrigatório" }}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome / Posição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Porsche GT3, Casa Marechal" {...field} />
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
                          <SelectValue />
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
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: New Fund, Garagem Paranhos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
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
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Compra</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Compra</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Atual</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Calculated fields - read only */}
              <FormItem>
                <FormLabel>P/L (Calculado)</FormLabel>
                <div className={cn(
                  "h-10 px-3 py-2 rounded-md border bg-muted text-sm flex items-center",
                  calculations.pnl !== null && calculations.pnl >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {calculations.pnl !== null ? formatCurrency(calculations.pnl, currency || "EUR") : "—"}
                </div>
              </FormItem>

              <FormItem>
                <FormLabel>Yield Anual (Calculado)</FormLabel>
                <div className={cn(
                  "h-10 px-3 py-2 rounded-md border bg-muted text-sm flex items-center",
                  calculations.yieldPercent !== null && calculations.yieldPercent >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {calculations.yieldPercent !== null ? `${calculations.yieldPercent.toFixed(2)}%` : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rendimento anualizado desde a data de compra
                </p>
              </FormItem>

              <FormField
                control={form.control}
                name="allocation_weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Atual (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="22" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_value_6m"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target 6M</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Target (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vintage_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano Vintage</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2016" {...field} />
                    </FormControl>
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
