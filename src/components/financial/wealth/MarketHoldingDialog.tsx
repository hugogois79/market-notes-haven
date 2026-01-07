import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [customSecurityName, setCustomSecurityName] = useState("");
  const [securityComboOpen, setSecurityComboOpen] = useState(false);
  const [securitySearch, setSecuritySearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
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

  useEffect(() => {
    if (holding) {
      // Check if name matches an existing security
      const existingSec = securities.find(
        (s) => s.name.toLowerCase() === holding.name.toLowerCase()
      );
      if (!existingSec) {
        setCustomSecurityName(holding.name);
      }
      
      // Calcular preço unitário a partir do valor total e quantidade
      const quantity = holding.quantity || 1;
      const unitPrice = holding.current_value ? holding.current_value / quantity : 0;
      const unitCostBasis = holding.cost_basis ? holding.cost_basis / quantity : 0;
      
      reset({
        name: holding.name,
        ticker: holding.ticker || "",
        isin: holding.isin || "",
        currency: holding.currency || "EUR",
        current_value: unitPrice.toLocaleString("pt-PT") || "",
        cost_basis: unitCostBasis.toLocaleString("pt-PT") || "",
        quantity: quantity.toLocaleString("pt-PT") || "",
        notes: holding.notes || "",
      });
    } else {
      setCustomSecurityName("");
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
  }, [holding, reset, securities]);

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

      const unitPrice = parsePortugueseNumber(data.current_value);
      const quantity = parsePortugueseNumber(data.quantity) || 1;
      const costBasisUnit = parsePortugueseNumber(data.cost_basis);
      
      // Valor total = preço unitário × quantidade
      const totalValue = unitPrice * quantity;
      const totalCostBasis = costBasisUnit * quantity;

      const payload = {
        name: data.name,
        ticker: data.ticker || null,
        isin: data.isin || null,
        currency: data.currency || "EUR",
        current_value: totalValue,
        cost_basis: totalCostBasis,
        quantity: quantity,
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
    // Permitir números, vírgula, ponto, menos e espaços
    const raw = e.target.value.replace(/[^\d,.\-\s]/g, "");
    setValue(field, raw);
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
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Popover open={securityComboOpen} onOpenChange={setSecurityComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={securityComboOpen}
                      className="w-full justify-between font-normal"
                    >
                      {nameValue ? (
                        <span className="truncate">
                          {nameValue} {watch("ticker") && `(${watch("ticker")})`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Selecione um ativo</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Pesquisar por nome ou ticker..." 
                        value={securitySearch}
                        onValueChange={setSecuritySearch}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum ativo encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="__new__"
                            onSelect={() => {
                              setCustomSecurityName("");
                              setValue("name", "");
                              setValue("ticker", "");
                              setValue("isin", "");
                              setValue("currency", "EUR");
                              setSecurityComboOpen(false);
                              setSecuritySearch("");
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar novo
                          </CommandItem>
                          {securities
                            .filter((s) => {
                              if (!securitySearch) return true;
                              const search = securitySearch.toLowerCase();
                              return (
                                s.name.toLowerCase().includes(search) ||
                                (s.ticker && s.ticker.toLowerCase().includes(search))
                              );
                            })
                            .map((s) => (
                              <CommandItem
                                key={s.id}
                                value={s.id}
                                onSelect={() => {
                                  setValue("name", s.name);
                                  setValue("ticker", s.ticker || "");
                                  setValue("isin", s.isin || "");
                                  setValue("currency", s.currency || "EUR");
                                  setCustomSecurityName("");
                                  setSecurityComboOpen(false);
                                  setSecuritySearch("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    nameValue === s.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {s.name} {s.ticker && `(${s.ticker})`}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {nameValue === "" && customSecurityName === "" && (
                  <Input
                    id="name-custom"
                    placeholder="Nome do novo ativo"
                    className="mt-2"
                    value={customSecurityName}
                    onChange={(e) => {
                      setCustomSecurityName(e.target.value);
                      setValue("name", e.target.value);
                    }}
                  />
                )}
                {/* Hidden input for form validation */}
                <input type="hidden" {...register("name", { required: "Nome é obrigatório" })} />
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
                <Label htmlFor="current_value">Preço Unit. ({watch("currency") || "EUR"})</Label>
                <Input
                  id="current_value"
                  placeholder="10 000"
                  value={watch("current_value")}
                  onChange={handleNumberChange("current_value")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_basis">Custo Unit. ({watch("currency") || "EUR"})</Label>
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
