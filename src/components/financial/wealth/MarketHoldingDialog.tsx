import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type MarketHolding = {
  id: string;
  user_id: string;
  asset_id: string;
  name: string;
  ticker: string | null;
  weight_target: number | null;
  weight_current: number | null;
  current_value: number | null;
  cost_basis: number | null;
  quantity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

interface MarketHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: MarketHolding | null;
  assetId: string | null;
}

type FormData = {
  name: string;
  ticker: string;
  current_value: string;
  cost_basis: string;
  quantity: string;
  weight_target: string;
  weight_current: string;
  notes: string;
};

const parsePortugueseNumber = (value: string): number => {
  // Remove spaces (thousand separators) and convert comma to dot
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
};

export default function MarketHoldingDialog({
  open,
  onOpenChange,
  holding,
  assetId,
}: MarketHoldingDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!holding;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      ticker: "",
      current_value: "",
      cost_basis: "",
      quantity: "",
      weight_target: "",
      weight_current: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (holding) {
      reset({
        name: holding.name,
        ticker: holding.ticker || "",
        current_value: holding.current_value?.toLocaleString("pt-PT") || "",
        cost_basis: holding.cost_basis?.toLocaleString("pt-PT") || "",
        quantity: holding.quantity?.toString() || "",
        weight_target: holding.weight_target?.toString() || "",
        weight_current: holding.weight_current?.toString() || "",
        notes: holding.notes || "",
      });
    } else {
      reset({
        name: "",
        ticker: "",
        current_value: "",
        cost_basis: "",
        quantity: "",
        weight_target: "",
        weight_current: "",
        notes: "",
      });
    }
  }, [holding, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        ticker: data.ticker || null,
        current_value: parsePortugueseNumber(data.current_value),
        cost_basis: parsePortugueseNumber(data.cost_basis),
        quantity: parseFloat(data.quantity) || null,
        weight_target: parseFloat(data.weight_target) || null,
        weight_current: parseFloat(data.weight_current) || null,
        notes: data.notes || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("market_holdings")
          .update(payload)
          .eq("id", holding.id);
        if (error) throw error;
      } else {
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase.from("market_holdings").insert({
          ...payload,
          user_id: user.user?.id,
          asset_id: assetId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-assets-with-holdings"] });
      toast.success(isEditing ? "Holding atualizado" : "Holding criado");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao guardar holding");
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  // Format number input with thousand separators
  const handleNumberChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,.-]/g, "");
    const normalized = raw.replace(",", ".");
    const num = parseFloat(normalized);
    if (!isNaN(num)) {
      const formatted = num.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
      setValue(field, formatted);
    } else if (raw === "" || raw === "-") {
      setValue(field, raw);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Holding" : "Novo Holding"}</DialogTitle>
          <DialogDescription>
            Adicione um ativo de mercado a esta conta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: US Treasury"
                  {...register("name", { required: "Nome é obrigatório" })}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticker">Ticker</Label>
                <Input
                  id="ticker"
                  placeholder="Ex: VGSH"
                  {...register("ticker")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_value">Valor Atual (€)</Label>
                <Input
                  id="current_value"
                  placeholder="10 000"
                  value={watch("current_value")}
                  onChange={handleNumberChange("current_value")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_basis">Custo Base (€)</Label>
                <Input
                  id="cost_basis"
                  placeholder="9 500"
                  value={watch("cost_basis")}
                  onChange={handleNumberChange("cost_basis")}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  placeholder="100"
                  {...register("quantity")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_current">Weight Atual %</Label>
                <Input
                  id="weight_current"
                  placeholder="25.5"
                  {...register("weight_current")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_target">Weight Target %</Label>
                <Input
                  id="weight_target"
                  placeholder="30.0"
                  {...register("weight_target")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionais..."
                rows={2}
                {...register("notes")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "A guardar..." : isEditing ? "Guardar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
