import { useState } from "react";
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
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Save } from "lucide-react";

interface SavePlanVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projected3M: number;
  projected6M: number;
  projected1Y: number;
  totalValue: number;
  futureTransactions: Array<{
    id: string;
    date: string;
    amount: number;
    asset_id: string | null;
    description?: string;
    counterparty?: string | null;
    category?: string | null;
    affects_asset_value?: boolean | null;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function SavePlanVersionDialog({
  open,
  onOpenChange,
  projected3M,
  projected6M,
  projected1Y,
  totalValue,
  futureTransactions,
}: SavePlanVersionDialogProps) {
  const queryClient = useQueryClient();
  const today = new Date();
  
  const [name, setName] = useState(`Plano ${format(today, "d MMM yyyy", { locale: pt })}`);
  const [notes, setNotes] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizador não autenticado");

      // Prepare cashflow snapshot from future transactions
      const cashflowSnapshot = futureTransactions.map((tx) => ({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        asset_id: tx.asset_id,
        description: tx.description || tx.counterparty || "",
        category: tx.category || null,
        affects_asset_value: tx.affects_asset_value,
      }));

      const { error } = await supabase
        .from("plan_snapshots")
        .insert({
          user_id: user.id,
          snapshot_date: today.toISOString().split("T")[0],
          name: name.trim() || null,
          notes: notes.trim() || null,
          projected_3m: projected3M,
          projected_6m: projected6M,
          projected_1y: projected1Y,
          total_value_at_snapshot: totalValue,
          cashflow_snapshot: cashflowSnapshot,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-snapshots"] });
      toast.success("Versão do plano guardada");
      onOpenChange(false);
      setName(`Plano ${format(new Date(), "d MMM yyyy", { locale: pt })}`);
      setNotes("");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao guardar: ${error.message}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Guardar Versão do Plano
          </DialogTitle>
          <DialogDescription>
            Guarda um snapshot do plano actual para comparação futura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Versão</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Plano Semana 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que mudou desde a última versão?"
              rows={3}
            />
          </div>

          {/* Preview of values being saved */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
            <div className="font-medium text-muted-foreground">Valores a guardar:</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Valor Actual:</span>{" "}
                <span className="font-medium">{formatCurrency(totalValue)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Transações:</span>{" "}
                <span className="font-medium">{futureTransactions.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Projecção 3M:</span>{" "}
                <span className="font-medium">{formatCurrency(projected3M)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Projecção 6M:</span>{" "}
                <span className="font-medium">{formatCurrency(projected6M)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Projecção 1 Ano:</span>{" "}
                <span className="font-medium">{formatCurrency(projected1Y)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "A guardar..." : "Guardar Versão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
