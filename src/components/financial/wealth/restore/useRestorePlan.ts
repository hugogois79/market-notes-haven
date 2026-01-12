import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  PlanSnapshot, 
  CashflowItem, 
  WealthTransaction, 
  RestoreMode, 
  ConflictResolution,
  ComparisonResult 
} from "./types";

interface RestoreOptions {
  snapshot: PlanSnapshot;
  mode: RestoreMode;
  createBackup: boolean;
  conflictResolutions?: ConflictResolution;
  currentTransactions: WealthTransaction[];
  comparison: ComparisonResult;
  currentProjections: {
    projected3M: number;
    projected6M: number;
    projected1Y: number;
    totalValue: number;
  };
}

export function useRestorePlan() {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: async (options: RestoreOptions) => {
      const { 
        snapshot, 
        mode, 
        createBackup, 
        conflictResolutions = {},
        currentTransactions,
        comparison,
        currentProjections 
      } = options;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");

      // 1. Create backup if requested
      if (createBackup) {
        const { error: backupError } = await supabase
          .from("plan_snapshots")
          .insert({
            user_id: user.id,
            name: `Backup antes de restaurar "${snapshot.name || 'Sem nome'}"`,
            snapshot_date: today,
            cashflow_snapshot: currentTransactions as unknown as import("@/integrations/supabase/types").Json,
            projected_3m: currentProjections.projected3M,
            projected_6m: currentProjections.projected6M,
            projected_1y: currentProjections.projected1Y,
            total_value_at_snapshot: currentProjections.totalValue,
            notes: `Backup automático criado antes de restaurar versão de ${format(new Date(snapshot.snapshot_date), "d MMM yyyy")}`,
          });

        if (backupError) throw new Error("Erro ao criar backup: " + backupError.message);
      }

      // 2. Execute restore based on mode
      if (mode === "replace") {
        // Delete all current future transactions
        const { error: deleteError } = await supabase
          .from("wealth_transactions")
          .delete()
          .eq("user_id", user.id)
          .gte("date", today);

        if (deleteError) throw new Error("Erro ao eliminar transações: " + deleteError.message);

        // Insert all snapshot transactions with new IDs
        const snapshotItems = Array.isArray(snapshot.cashflow_snapshot)
          ? (snapshot.cashflow_snapshot as unknown as CashflowItem[])
          : [];

        if (snapshotItems.length > 0) {
          const newTransactions = snapshotItems.map(item => ({
            id: crypto.randomUUID(),
            user_id: user.id,
            date: item.date,
            amount: item.amount,
            asset_id: item.asset_id,
            description: item.description,
            category: item.category,
            transaction_type: item.amount >= 0 ? "income" : "expense",
          }));

          const { error: insertError } = await supabase
            .from("wealth_transactions")
            .insert(newTransactions);

          if (insertError) throw new Error("Erro ao inserir transações: " + insertError.message);
        }
      } else {
        // Merge mode
        const { onlyInSnapshot, conflicts } = comparison;

        // Add transactions that only exist in snapshot
        if (onlyInSnapshot.length > 0) {
          const newTransactions = onlyInSnapshot.map(item => ({
            id: crypto.randomUUID(),
            user_id: user.id,
            date: item.date,
            amount: item.amount,
            asset_id: item.asset_id,
            description: item.description,
            category: item.category,
            transaction_type: item.amount >= 0 ? "income" : "expense",
          }));

          const { error: insertError } = await supabase
            .from("wealth_transactions")
            .insert(newTransactions);

          if (insertError) throw new Error("Erro ao inserir novas transações: " + insertError.message);
        }

        // Handle conflicts based on user resolution
        for (const conflict of conflicts) {
          const resolution = conflictResolutions[conflict.snapshot.id];
          
          if (resolution === "snapshot") {
            // Update current with snapshot values
            const { error: updateError } = await supabase
              .from("wealth_transactions")
              .update({
                amount: conflict.snapshot.amount,
                description: conflict.snapshot.description,
                category: conflict.snapshot.category,
              })
              .eq("id", conflict.current.id);

            if (updateError) throw new Error("Erro ao actualizar transação: " + updateError.message);
          }
          // If "current", do nothing - keep current value
        }
      }

      return { mode, snapshotName: snapshot.name };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wealth-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["plan-snapshots"] });
      toast.success(
        data.mode === "replace" 
          ? "Plano substituído com sucesso!" 
          : "Merge concluído com sucesso!"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao restaurar plano");
    },
  });

  return restoreMutation;
}
