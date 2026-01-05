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

type WealthAsset = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  status: string | null;
  current_value: number | null;
  purchase_price: number | null;
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
  profit_loss_value: string;
  yield_expected: string;
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
      profit_loss_value: "",
      yield_expected: "",
      allocation_weight: "",
      target_value_6m: "",
      target_weight: "",
      vintage_year: "",
      currency: "EUR",
      notes: "",
    },
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name || "",
        category: asset.category || "Real Estate",
        subcategory: asset.subcategory || "",
        status: asset.status || "Active",
        current_value: asset.current_value?.toString() || "",
        purchase_price: asset.purchase_price?.toString() || "",
        profit_loss_value: asset.profit_loss_value?.toString() || "",
        yield_expected: asset.yield_expected?.toString() || "",
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
        profit_loss_value: "",
        yield_expected: "",
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
      const payload = {
        name: values.name,
        category: values.category,
        subcategory: values.subcategory || null,
        status: values.status,
        current_value: values.current_value ? parseFloat(values.current_value) : null,
        purchase_price: values.purchase_price ? parseFloat(values.purchase_price) : null,
        profit_loss_value: values.profit_loss_value ? parseFloat(values.profit_loss_value) : null,
        yield_expected: values.yield_expected ? parseFloat(values.yield_expected) : null,
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
                name="profit_loss_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>P/L (Ganho/Perda)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yield_expected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yld Exp. (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="3.75" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
