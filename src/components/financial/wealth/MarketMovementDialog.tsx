import { useState, useEffect } from "react";
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

type MarketMovement = {
  id: string;
  user_id: string;
  holding_id: string;
  movement_type: string;
  movement_date: string;
  quantity: number | null;
  price_per_unit: number | null;
  total_value: number;
  currency: string;
  notes: string | null;
};

type MarketHolding = {
  id: string;
  name: string;
  ticker: string | null;
  currency: string | null;
};

type Security = {
  id: string;
  name: string;
  ticker: string | null;
  currency: string | null;
  current_price: number | null;
};

interface MarketMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement?: MarketMovement | null;
  holdings: MarketHolding[];
  preSelectedHoldingId?: string | null;
  assetId?: string | null;
}

const MOVEMENT_TYPES = [
  { value: "buy", label: "Compra" },
  { value: "sell", label: "Venda" },
  { value: "dividend", label: "Dividendo" },
  { value: "split", label: "Split" },
  { value: "transfer_in", label: "Transferência Entrada" },
  { value: "transfer_out", label: "Transferência Saída" },
  { value: "fee", label: "Comissão" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

// Parse Portuguese number format
const parsePortugueseNumber = (value: string): number => {
  if (!value) return 0;
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
};

export default function MarketMovementDialog({
  open,
  onOpenChange,
  movement,
  holdings,
  preSelectedHoldingId,
  assetId,
}: MarketMovementDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!movement;

  const [selectionMode, setSelectionMode] = useState<"holding" | "security">("holding");
  const [holdingId, setHoldingId] = useState("");
  const [securityId, setSecurityId] = useState("");
  const [movementType, setMovementType] = useState("buy");
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split("T")[0]);
  const [quantity, setQuantity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [notes, setNotes] = useState("");

  // Fetch securities for new titles
  const { data: securities = [] } = useQuery({
    queryKey: ["securities-for-movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("securities")
        .select("id, name, ticker, currency, current_price")
        .order("name");
      if (error) throw error;
      return data as Security[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (movement) {
      setSelectionMode("holding");
      setHoldingId(movement.holding_id);
      setSecurityId("");
      setMovementType(movement.movement_type);
      setMovementDate(movement.movement_date);
      setQuantity(movement.quantity?.toString().replace(".", ",") || "");
      setPricePerUnit(movement.price_per_unit?.toString().replace(".", ",") || "");
      setTotalValue(movement.total_value.toString().replace(".", ","));
      setCurrency(movement.currency);
      setNotes(movement.notes || "");
    } else {
      setSelectionMode(preSelectedHoldingId ? "holding" : "holding");
      setHoldingId(preSelectedHoldingId || "");
      setSecurityId("");
      setMovementType("buy");
      setMovementDate(new Date().toISOString().split("T")[0]);
      setQuantity("");
      setPricePerUnit("");
      setTotalValue("");
      setCurrency("EUR");
      setNotes("");
    }
  }, [movement, preSelectedHoldingId, open]);

  // Update currency and price when holding or security changes
  useEffect(() => {
    if (selectionMode === "holding" && holdingId) {
      const selectedHolding = holdings.find((h) => h.id === holdingId);
      if (selectedHolding?.currency) {
        setCurrency(selectedHolding.currency);
      }
    } else if (selectionMode === "security" && securityId) {
      const selectedSecurity = securities.find((s) => s.id === securityId);
      if (selectedSecurity?.currency) {
        setCurrency(selectedSecurity.currency);
      }
      // Pre-fill price from security's current_price
      if (selectedSecurity?.current_price) {
        setPricePerUnit(selectedSecurity.current_price.toString().replace(".", ","));
      }
    }
  }, [holdingId, securityId, selectionMode, holdings, securities]);

  // Auto-calculate total when qty and price change
  useEffect(() => {
    const qty = parsePortugueseNumber(quantity);
    const price = parsePortugueseNumber(pricePerUnit);
    if (qty > 0 && price > 0) {
      setTotalValue((qty * price).toFixed(2).replace(".", ","));
    }
  }, [quantity, pricePerUnit]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      let finalHoldingId = holdingId;

      // If using security mode, we need to create a holding first or find existing
      if (selectionMode === "security" && securityId) {
        const selectedSecurity = securities.find((s) => s.id === securityId);
        if (!selectedSecurity) throw new Error("Security not found");

        // Check if holding already exists for this security
        const { data: existingHolding } = await supabase
          .from("market_holdings")
          .select("id")
          .eq("security_id", securityId)
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (existingHolding) {
          finalHoldingId = existingHolding.id;
        } else {
          // Use provided assetId or fallback to first wealth asset
          let targetAssetId = assetId;
          
          if (!targetAssetId) {
            const { data: assets } = await supabase
              .from("wealth_assets")
              .select("id")
              .eq("user_id", userData.user.id)
              .limit(1);
            
            if (!assets || assets.length === 0) {
              throw new Error("No account found to associate holding");
            }
            targetAssetId = assets[0].id;
          }

          // Create new holding
          const { data: newHolding, error: holdingError } = await supabase
            .from("market_holdings")
            .insert({
              user_id: userData.user.id,
              asset_id: targetAssetId,
              security_id: securityId,
              name: selectedSecurity.name,
              ticker: selectedSecurity.ticker,
              currency: selectedSecurity.currency || "EUR",
              quantity: 0,
              cost_basis: 0,
              current_value: 0,
            })
            .select("id")
            .single();

          if (holdingError) throw holdingError;
          finalHoldingId = newHolding.id;
        }
      }

      const payload = {
        user_id: userData.user.id,
        holding_id: finalHoldingId,
        movement_type: movementType,
        movement_date: movementDate,
        quantity: quantity ? parsePortugueseNumber(quantity) : null,
        price_per_unit: pricePerUnit ? parsePortugueseNumber(pricePerUnit) : null,
        total_value: parsePortugueseNumber(totalValue),
        currency,
        notes: notes || null,
      };

      if (isEditing && movement) {
        const { error } = await supabase
          .from("market_movements")
          .update(payload)
          .eq("id", movement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("market_movements").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-movements"] });
      queryClient.invalidateQueries({ queryKey: ["market-holdings"] });
      toast.success(isEditing ? "Movimento atualizado" : "Movimento adicionado");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving movement:", error);
      toast.error("Erro ao guardar movimento");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectionMode === "holding" && !holdingId) {
      toast.error("Selecione um holding");
      return;
    }
    if (selectionMode === "security" && !securityId) {
      toast.error("Selecione um título");
      return;
    }
    if (!totalValue || parsePortugueseNumber(totalValue) <= 0) {
      toast.error("Insira um valor total válido");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Movimento" : "Adicionar Movimento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selection Mode Toggle */}
          <div className="space-y-2">
            <Label>Associar a</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectionMode === "holding" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectionMode("holding")}
                className="flex-1"
              >
                Holding Existente
              </Button>
              <Button
                type="button"
                variant={selectionMode === "security" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectionMode("security")}
                className="flex-1"
              >
                Novo Título
              </Button>
            </div>
          </div>

          {selectionMode === "holding" ? (
            <div className="space-y-2">
              <Label>Holding</Label>
              <Select value={holdingId} onValueChange={setHoldingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar holding..." />
                </SelectTrigger>
                <SelectContent>
                  {holdings.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name} {h.ticker && `(${h.ticker})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Título (Security)</Label>
              <Select value={securityId} onValueChange={setSecurityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar título..." />
                </SelectTrigger>
                <SelectContent>
                  {securities.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.ticker && `(${s.ticker})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Preço Unitário</Label>
              <Input
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Total</Label>
              <Input
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Moeda</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center">
                {currency}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas opcionais..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "A guardar..." : isEditing ? "Guardar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
