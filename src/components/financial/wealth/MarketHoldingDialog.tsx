import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  isin: string | null;
  currency: string | null;
  weight_target: number | null;
  weight_current: number | null;
  current_value: number | null;
  cost_basis: number | null;
  quantity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Security = {
  id: string;
  name: string;
  ticker: string | null;
  isin: string | null;
  currency: string | null;
};

interface MarketHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: MarketHolding | null;
  assetId: string | null;
  accountName: string;
}

type FormData = {
  name: string;
  ticker: string;
  isin: string;
  currency: string;
  current_value: string;
  cost_basis: string;
  quantity: string;
  notes: string;
};

const parsePortugueseNumber = (value: string): number => {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
};

export default function MarketHoldingDialog({
  open,
  onOpenChange,
  holding,
  assetId,
  accountName,
}: MarketHoldingDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!holding;
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      isin: "",
      currency: "EUR",
      current_value: "",
      cost_basis: "",
      quantity: "",
      notes: "",
    },
  });

  const nameValue = watch("name");

  // Fetch existing securities
  const { data: securities = [] } = useQuery({
    queryKey: ["securities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("securities")
        .select("id, name, ticker, isin, currency")
        .order("name");
      if (error) throw error;
      return data as Security[];
    },
  });

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!nameValue || nameValue.length < 2) return [];
    const lowerName = nameValue.toLowerCase();
    return securities.filter((s) =>
      s.name.toLowerCase().includes(lowerName)
    ).slice(0, 5);
  }, [nameValue, securities]);

  // Auto-fill when security is selected
  const selectSecurity = (security: Security) => {
    setValue("name", security.name);
    setValue("ticker", security.ticker || "");
    setValue("isin", security.isin || "");
    setValue("currency", security.currency || "EUR");
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (holding) {
      reset({
        name: holding.name,
        ticker: holding.ticker || "",
        isin: holding.isin || "",
        currency: holding.currency || "EUR",
        current_value: holding.current_value?.toLocaleString("pt-PT") || "",
        cost_basis: holding.cost_basis?.toLocaleString("pt-PT") || "",
        quantity: holding.quantity?.toLocaleString("pt-PT") || "",
        notes: holding.notes || "",
      });
    } else {
      reset({
        name: "",
        ticker: "",
        isin: "",
        currency: "EUR",
        current_value: "",
        cost_basis: "",
        quantity: "",
        notes: "",
      });
    }
  }, [holding, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      // Check if security exists, if not create it
      const existingSecurity = securities.find(
        (s) => s.name.toLowerCase() === data.name.toLowerCase()
      );

      let securityId = existingSecurity?.id;

      if (!existingSecurity && data.name) {
        const { data: newSecurity, error: secError } = await supabase
          .from("securities")
          .insert({
            user_id: userId,
            name: data.name,
            ticker: data.ticker || null,
            isin: data.isin || null,
            currency: data.currency || "EUR",
          })
          .select("id")
          .single();

        if (secError) {
          console.error("Error creating security:", secError);
        } else {
          securityId = newSecurity.id;
        }
      }

      const payload = {
        name: data.name,
        ticker: data.ticker || null,
        isin: data.isin || null,
        currency: data.currency || "EUR",
        current_value: parsePortugueseNumber(data.current_value),
        cost_basis: parsePortugueseNumber(data.cost_basis),
        quantity: parsePortugueseNumber(data.quantity) || null,
        notes: data.notes || null,
        security_id: securityId || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("market_holdings")
          .update(payload)
          .eq("id", holding.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("market_holdings").insert({
          ...payload,
          user_id: userId,
          asset_id: assetId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-assets-with-holdings"] });
      queryClient.invalidateQueries({ queryKey: ["securities"] });
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
          <DialogTitle>
            {isEditing ? "Editar Holding" : "Novo Holding"} - {accountName}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do ativo de mercado." : `Adicione um ativo de mercado à conta ${accountName}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: US Treasury"
                  {...register("name", { required: "Nome é obrigatório" })}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex justify-between items-center"
                        onMouseDown={() => selectSecurity(s)}
                      >
                        <span>{s.name}</span>
                        <span className="text-muted-foreground text-xs">{s.ticker}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                <Label htmlFor="isin">ISIN</Label>
                <Input
                  id="isin"
                  placeholder="Ex: US1234567890"
                  {...register("isin")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <select
                  id="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("currency")}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_value">Valor Atual ({watch("currency") || "EUR"})</Label>
                <Input
                  id="current_value"
                  placeholder="10 000"
                  value={watch("current_value")}
                  onChange={handleNumberChange("current_value")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_basis">Custo Base ({watch("currency") || "EUR"})</Label>
                <Input
                  id="cost_basis"
                  placeholder="9 500"
                  value={watch("cost_basis")}
                  onChange={handleNumberChange("cost_basis")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  placeholder="1 000 000"
                  value={watch("quantity")}
                  onChange={handleNumberChange("quantity")}
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
