import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  RotateCcw, 
  GitMerge, 
  Replace, 
  Shield, 
  AlertTriangle,
  ChevronRight,
  Loader2
} from "lucide-react";
import { 
  PlanSnapshot, 
  CashflowItem, 
  WealthTransaction, 
  RestoreMode, 
  ConflictResolution,
  ComparisonResult 
} from "./types";
import { useRestorePlan } from "./useRestorePlan";
import PlanComparisonView from "./PlanComparisonView";
import ConflictResolver from "./ConflictResolver";

interface RestorePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: PlanSnapshot | null;
  currentProjections: {
    projected3M: number;
    projected6M: number;
    projected1Y: number;
    totalValue: number;
  };
}

export default function RestorePlanDialog({
  open,
  onOpenChange,
  snapshot,
  currentProjections,
}: RestorePlanDialogProps) {
  const [mode, setMode] = useState<RestoreMode>("replace");
  const [createBackup, setCreateBackup] = useState(true);
  const [conflictResolutions, setConflictResolutions] = useState<ConflictResolution>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState("options");

  const restoreMutation = useRestorePlan();

  // Fetch current future transactions
  const { data: currentTransactions = [], isLoading } = useQuery({
    queryKey: ["wealth-transactions-future"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("wealth_transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", today)
        .order("date", { ascending: true });

      if (error) throw error;
      return (data || []) as WealthTransaction[];
    },
    enabled: open && !!snapshot,
  });

  // Compare plans
  const comparison = useMemo((): ComparisonResult => {
    if (!snapshot || isLoading) {
      return { onlyInSnapshot: [], onlyInCurrent: [], conflicts: [], unchanged: [] };
    }

    const snapshotItems = Array.isArray(snapshot.cashflow_snapshot)
      ? (snapshot.cashflow_snapshot as unknown as CashflowItem[])
      : [];

    // Create maps for comparison - match by description + date for more accurate matching
    const snapshotByKey = new Map<string, CashflowItem>();
    const currentByKey = new Map<string, WealthTransaction>();
    
    snapshotItems.forEach(item => {
      const key = `${item.description}-${item.date}`;
      snapshotByKey.set(key, item);
    });
    
    currentTransactions.forEach(item => {
      const key = `${item.description}-${item.date}`;
      currentByKey.set(key, item);
    });

    const onlyInSnapshot: CashflowItem[] = [];
    const onlyInCurrent: WealthTransaction[] = [];
    const conflicts: Array<{ snapshot: CashflowItem; current: WealthTransaction }> = [];
    const unchanged: CashflowItem[] = [];

    // Check snapshot items
    snapshotByKey.forEach((snapItem, key) => {
      const currentItem = currentByKey.get(key);
      if (!currentItem) {
        onlyInSnapshot.push(snapItem);
      } else if (Math.abs(snapItem.amount - currentItem.amount) > 0.01) {
        conflicts.push({ snapshot: snapItem, current: currentItem });
      } else {
        unchanged.push(snapItem);
      }
    });

    // Check current items not in snapshot
    currentByKey.forEach((currentItem, key) => {
      if (!snapshotByKey.has(key)) {
        onlyInCurrent.push(currentItem);
      }
    });

    return { onlyInSnapshot, onlyInCurrent, conflicts, unchanged };
  }, [snapshot, currentTransactions, isLoading]);

  const handleRestore = () => {
    if (!snapshot) return;

    // If merge mode with unresolved conflicts, don't proceed
    if (mode === "merge" && comparison.conflicts.length > 0) {
      const allResolved = comparison.conflicts.every(c => conflictResolutions[c.snapshot.id]);
      if (!allResolved) {
        setActiveTab("conflicts");
        return;
      }
    }

    setShowConfirmation(true);
  };

  const confirmRestore = () => {
    if (!snapshot) return;

    restoreMutation.mutate({
      snapshot,
      mode,
      createBackup,
      conflictResolutions,
      currentTransactions,
      comparison,
      currentProjections,
    }, {
      onSuccess: () => {
        setShowConfirmation(false);
        onOpenChange(false);
        // Reset state
        setMode("replace");
        setCreateBackup(true);
        setConflictResolutions({});
        setActiveTab("options");
      },
    });
  };

  const snapshotItemCount = Array.isArray(snapshot?.cashflow_snapshot)
    ? (snapshot.cashflow_snapshot as unknown as CashflowItem[]).length
    : 0;

  const hasConflicts = comparison.conflicts.length > 0;
  const allConflictsResolved = comparison.conflicts.every(c => conflictResolutions[c.snapshot.id]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Restaurar "{snapshot?.name || 'Versão'}"
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="options">Opções</TabsTrigger>
                <TabsTrigger value="comparison">Comparação</TabsTrigger>
                <TabsTrigger value="conflicts" disabled={!hasConflicts}>
                  Conflitos
                  {hasConflicts && (
                    <Badge 
                      variant="destructive" 
                      className="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
                    >
                      {comparison.conflicts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto py-4">
                <TabsContent value="options" className="mt-0 space-y-4">
                  {/* Restore mode selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Método de Restauro</label>
                    
                    <div 
                      className={cn(
                        "rounded-lg border-2 p-3 cursor-pointer transition-colors",
                        mode === "replace" 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-muted-foreground/50"
                      )}
                      onClick={() => setMode("replace")}
                    >
                      <div className="flex items-center gap-3">
                        <Replace className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Substituir Tudo</div>
                          <div className="text-xs text-muted-foreground">
                            Elimina {currentTransactions.length} transações actuais e substitui 
                            por {snapshotItemCount} do snapshot
                          </div>
                        </div>
                        <div className={cn(
                          "h-4 w-4 rounded-full border-2",
                          mode === "replace" ? "border-primary bg-primary" : "border-muted-foreground"
                        )}>
                          {mode === "replace" && (
                            <div className="h-full w-full flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div 
                      className={cn(
                        "rounded-lg border-2 p-3 cursor-pointer transition-colors",
                        mode === "merge" 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-muted-foreground/50"
                      )}
                      onClick={() => setMode("merge")}
                    >
                      <div className="flex items-center gap-3">
                        <GitMerge className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Merge Inteligente</div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div>• {comparison.unchanged.length} transações iguais (mantém)</div>
                            <div>• {comparison.onlyInSnapshot.length} novas do snapshot (adiciona)</div>
                            <div>• {comparison.onlyInCurrent.length} só no actual (mantém)</div>
                            {hasConflicts && (
                              <div className="text-amber-600 font-medium">
                                • {comparison.conflicts.length} conflitos para resolver
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={cn(
                          "h-4 w-4 rounded-full border-2",
                          mode === "merge" ? "border-primary bg-primary" : "border-muted-foreground"
                        )}>
                          {mode === "merge" && (
                            <div className="h-full w-full flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Backup option */}
                  <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <label 
                        htmlFor="backup-checkbox" 
                        className="font-medium text-sm cursor-pointer"
                      >
                        Criar backup automático
                      </label>
                      <div className="text-xs text-muted-foreground">
                        Guarda o plano actual antes de restaurar
                      </div>
                    </div>
                    <Checkbox
                      id="backup-checkbox"
                      checked={createBackup}
                      onCheckedChange={(checked) => setCreateBackup(checked === true)}
                    />
                  </div>

                  {/* Warning for merge with conflicts */}
                  {mode === "merge" && hasConflicts && !allConflictsResolved && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="text-xs text-amber-800 dark:text-amber-200">
                        <div className="font-medium">Conflitos por resolver</div>
                        <div>Vai ao separador "Conflitos" para escolher qual valor manter em cada caso.</div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="comparison" className="mt-0">
                  <PlanComparisonView comparison={comparison} />
                </TabsContent>

                <TabsContent value="conflicts" className="mt-0">
                  {hasConflicts ? (
                    <ConflictResolver
                      conflicts={comparison.conflicts}
                      resolutions={conflictResolutions}
                      onResolutionChange={setConflictResolutions}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Não há conflitos para resolver
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRestore}
              disabled={
                isLoading || 
                restoreMutation.isPending ||
                (mode === "merge" && hasConflicts && !allConflictsResolved)
              }
            >
              {restoreMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A restaurar...
                </>
              ) : (
                <>
                  Restaurar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Restauro</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Vais {mode === "replace" ? "substituir" : "fazer merge d"}o plano actual com 
                a versão "<strong>{snapshot?.name || 'Sem nome'}</strong>" de{" "}
                {snapshot && format(new Date(snapshot.snapshot_date), "d MMMM yyyy", { locale: pt })}.
              </p>
              {createBackup && (
                <p className="text-green-600 text-sm">
                  ✓ Um backup do plano actual será criado automaticamente
                </p>
              )}
              {mode === "replace" && (
                <p className="text-amber-600 text-sm">
                  ⚠ {currentTransactions.length} transações actuais serão eliminadas
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              Confirmar Restauro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
