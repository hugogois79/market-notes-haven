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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, Target, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import WealthMilestoneDialog from "./WealthMilestoneDialog";

type WealthMilestone = {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  target_value: number;
  target_date: string | null;
  category: string | null;
  status: string | null;
  achieved_date: string | null;
  created_at: string;
  updated_at: string;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: "Ativo", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Target },
  achieved: { label: "Atingido", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-muted text-muted-foreground border-muted", icon: XCircle },
};

export default function WealthMilestonesTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<WealthMilestone | null>(null);

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["wealth-milestones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_milestones")
        .select("*")
        .order("status", { ascending: true })
        .order("target_date", { ascending: true });

      if (error) throw error;
      return data as WealthMilestone[];
    },
  });

  // Get current portfolio value for progress calculation
  const { data: assets = [] } = useQuery({
    queryKey: ["wealth-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_assets")
        .select("current_value, status")
        .neq("status", "In Recovery");

      if (error) throw error;
      return data || [];
    },
  });

  const currentPortfolioValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wealth_milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wealth-milestones"] });
      toast.success("Milestone eliminado");
    },
    onError: () => {
      toast.error("Erro ao eliminar milestone");
    },
  });

  const handleEdit = (milestone: WealthMilestone) => {
    setEditingMilestone(milestone);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingMilestone(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingMilestone(null);
  };

  const activeMilestones = milestones.filter((m) => m.status === "active");
  const completedMilestones = milestones.filter((m) => m.status !== "active");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        A carregar milestones...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Milestones Financeiros</h3>
          <p className="text-sm text-muted-foreground">
            Portfolio Atual: {formatCurrency(currentPortfolioValue)} | {activeMilestones.length} milestones ativos
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Milestone
        </Button>
      </div>

      {/* Active Milestones */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Milestone</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor Alvo</TableHead>
              <TableHead className="w-[200px]">Progresso</TableHead>
              <TableHead>Data Alvo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeMilestones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Sem milestones ativos. Crie o primeiro milestone para acompanhar os seus objetivos.
                </TableCell>
              </TableRow>
            ) : (
              activeMilestones.map((milestone) => {
                const progress = Math.min(
                  (currentPortfolioValue / milestone.target_value) * 100,
                  100
                );
                const config = statusConfig[milestone.status || "active"];
                const Icon = config.icon;

                return (
                  <TableRow key={milestone.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{milestone.name}</span>
                        {milestone.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {milestone.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {milestone.category ? (
                        <Badge variant="outline" className="text-xs">
                          {milestone.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(milestone.target_value)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.toFixed(1)}%</span>
                          <span>{formatCurrency(milestone.target_value - currentPortfolioValue)} restante</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {milestone.target_date
                        ? format(new Date(milestone.target_date), "dd MMM yyyy", { locale: pt })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs gap-1", config.color)}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(milestone)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteMutation.mutate(milestone.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Completed/Cancelled Milestones */}
      {completedMilestones.length > 0 && (
        <div className="rounded-md border border-muted">
          <div className="px-4 py-3 border-b bg-muted/50">
            <h4 className="font-semibold text-muted-foreground">
              Milestones Concluídos ({completedMilestones.length})
            </h4>
          </div>
          <Table>
            <TableBody>
              {completedMilestones.map((milestone) => {
                const config = statusConfig[milestone.status || "active"];
                const Icon = config.icon;

                return (
                  <TableRow key={milestone.id} className="opacity-60">
                    <TableCell className="font-medium">{milestone.name}</TableCell>
                    <TableCell>{milestone.category || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(milestone.target_value)}
                    </TableCell>
                    <TableCell>
                      {milestone.achieved_date
                        ? format(new Date(milestone.achieved_date), "dd MMM yyyy", { locale: pt })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs gap-1", config.color)}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[80px]">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(milestone)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteMutation.mutate(milestone.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <WealthMilestoneDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        milestone={editingMilestone}
      />
    </div>
  );
}
