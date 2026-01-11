import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, GitCompare, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Json } from "@/integrations/supabase/types";

interface PlanSnapshot {
  id: string;
  snapshot_date: string;
  name: string | null;
  notes: string | null;
  projected_3m: number | null;
  projected_6m: number | null;
  projected_1y: number | null;
  total_value_at_snapshot: number | null;
  cashflow_snapshot: Json;
  created_at: string;
}

interface CashflowItem {
  id: string;
  date: string;
  amount: number;
  asset_id: string | null;
  description: string;
  category: string | null;
}

const formatCurrency = (value: number | null) => {
  if (value === null) return "-";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface PlanVersionsListProps {
  currentProjected3M: number;
  currentProjected6M: number;
  currentProjected1Y: number;
  currentTotalValue: number;
}

export default function PlanVersionsList({
  currentProjected3M,
  currentProjected6M,
  currentProjected1Y,
  currentTotalValue,
}: PlanVersionsListProps) {
  const queryClient = useQueryClient();
  const [selectedSnapshot, setSelectedSnapshot] = useState<PlanSnapshot | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["plan-snapshots"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("plan_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .order("snapshot_date", { ascending: false });

      if (error) throw error;
      return (data || []) as PlanSnapshot[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("plan_snapshots")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-snapshots"] });
      toast.success("Versão eliminada");
    },
    onError: () => {
      toast.error("Erro ao eliminar versão");
    },
  });

  const handleViewDetails = (snapshot: PlanSnapshot) => {
    setSelectedSnapshot(snapshot);
    setDetailsOpen(true);
  };

  const getDifference = (snapshotValue: number | null, currentValue: number) => {
    if (snapshotValue === null) return null;
    return currentValue - snapshotValue;
  };

  const renderDifference = (diff: number | null) => {
    if (diff === null) return null;
    const isPositive = diff >= 0;
    return (
      <span className={cn(
        "flex items-center gap-0.5 text-xs",
        isPositive ? "text-green-600" : "text-red-500"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {formatCurrency(Math.abs(diff))}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        A carregar versões...
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>Ainda não guardaste nenhuma versão do plano.</p>
        <p className="text-xs mt-1">Usa o botão "Guardar Versão" para criar um snapshot.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="text-xs">
              <TableHead className="py-2">Data</TableHead>
              <TableHead className="py-2">Nome</TableHead>
              <TableHead className="text-right py-2">Valor na Altura</TableHead>
              <TableHead className="text-right py-2">Proj. 3M</TableHead>
              <TableHead className="text-right py-2">Proj. 1A</TableHead>
              <TableHead className="text-right py-2">Transações</TableHead>
              <TableHead className="text-right py-2 w-[80px]">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshots.map((snapshot) => {
              const cashflowItems = Array.isArray(snapshot.cashflow_snapshot) 
                ? (snapshot.cashflow_snapshot as unknown as CashflowItem[]) 
                : [];
              const diff1Y = getDifference(snapshot.projected_1y, currentProjected1Y);
              
              return (
                <TableRow key={snapshot.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="py-1.5">
                    {format(new Date(snapshot.snapshot_date), "d MMM yyyy", { locale: pt })}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div>
                      <span className="font-medium">{snapshot.name || "Sem nome"}</span>
                      {snapshot.notes && (
                        <p className="text-muted-foreground text-[10px] truncate max-w-[200px]">
                          {snapshot.notes}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-1.5">
                    {formatCurrency(snapshot.total_value_at_snapshot)}
                  </TableCell>
                  <TableCell className="text-right py-1.5">
                    <div className="flex flex-col items-end">
                      <span>{formatCurrency(snapshot.projected_3m)}</span>
                      {renderDifference(getDifference(snapshot.projected_3m, currentProjected3M))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-1.5">
                    <div className="flex flex-col items-end">
                      <span>{formatCurrency(snapshot.projected_1y)}</span>
                      {renderDifference(diff1Y)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {cashflowItems.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-1.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewDetails(snapshot)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(snapshot.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              {selectedSnapshot?.name || "Detalhes da Versão"}
            </DialogTitle>
          </DialogHeader>

          {selectedSnapshot && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Data:</span>{" "}
                  <span className="font-medium">
                    {format(new Date(selectedSnapshot.snapshot_date), "d MMMM yyyy", { locale: pt })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Criado:</span>{" "}
                  <span className="font-medium">
                    {format(new Date(selectedSnapshot.created_at), "d MMM yyyy HH:mm", { locale: pt })}
                  </span>
                </div>
              </div>

              {selectedSnapshot.notes && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Notas:</div>
                  <p className="text-sm">{selectedSnapshot.notes}</p>
                </div>
              )}

              {/* Projections Comparison */}
              <div className="rounded-lg border p-3">
                <div className="text-xs font-medium mb-2">Projecções: Então vs Agora</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">3 Meses</div>
                    <div className="flex items-center justify-between">
                      <span>{formatCurrency(selectedSnapshot.projected_3m)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{formatCurrency(currentProjected3M)}</span>
                    </div>
                    {renderDifference(getDifference(selectedSnapshot.projected_3m, currentProjected3M))}
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">6 Meses</div>
                    <div className="flex items-center justify-between">
                      <span>{formatCurrency(selectedSnapshot.projected_6m)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{formatCurrency(currentProjected6M)}</span>
                    </div>
                    {renderDifference(getDifference(selectedSnapshot.projected_6m, currentProjected6M))}
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">1 Ano</div>
                    <div className="flex items-center justify-between">
                      <span>{formatCurrency(selectedSnapshot.projected_1y)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{formatCurrency(currentProjected1Y)}</span>
                    </div>
                    {renderDifference(getDifference(selectedSnapshot.projected_1y, currentProjected1Y))}
                  </div>
                </div>
              </div>

              {/* Cashflow Snapshot */}
              <div>
                <div className="text-xs font-medium mb-2">Transações Planeadas na Altura:</div>
                <div className="rounded-md border max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow className="text-xs">
                        <TableHead className="py-1.5">Data</TableHead>
                        <TableHead className="py-1.5">Descrição</TableHead>
                        <TableHead className="py-1.5">Categoria</TableHead>
                        <TableHead className="text-right py-1.5">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const items = Array.isArray(selectedSnapshot.cashflow_snapshot) 
                          ? (selectedSnapshot.cashflow_snapshot as unknown as CashflowItem[]) 
                          : [];
                        if (items.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                Sem transações guardadas
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return items.map((item: CashflowItem) => (
                          <TableRow key={item.id} className="text-xs">
                            <TableCell className="py-1">
                              {format(new Date(item.date), "d MMM yyyy", { locale: pt })}
                            </TableCell>
                            <TableCell className="py-1">{item.description}</TableCell>
                            <TableCell className="py-1">
                              {item.category && (
                                <Badge variant="outline" className="text-[10px]">
                                  {item.category}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right py-1 font-medium",
                              item.amount >= 0 ? "text-green-600" : "text-red-500"
                            )}>
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
