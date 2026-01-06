import React, { useState } from "react";
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
import { Plus, Pencil, Trash2, Target, CheckCircle2, XCircle, ShoppingCart, Tag } from "lucide-react";
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
  asset_id: string | null;
  milestone_type: string | null;
  created_at: string;
  updated_at: string;
};

type WealthAsset = {
  id: string;
  name: string;
  category: string;
  current_value: number | null;
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

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  portfolio: { label: "Portfolio", icon: Target, color: "text-blue-500" },
  buy: { label: "Comprar", icon: ShoppingCart, color: "text-green-500" },
  sell: { label: "Vender", icon: Tag, color: "text-orange-500" },
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

  // Get assets for displaying linked asset names
  const { data: assets = [] } = useQuery({
    queryKey: ["wealth-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_assets")
        .select("id, name, category, current_value, status")
        .neq("status", "In Recovery");

      if (error) throw error;
      return data as WealthAsset[];
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

  const getAssetName = (assetId: string | null) => {
    if (!assetId) return null;
    const asset = assets.find((a) => a.id === assetId);
    return asset?.name || null;
  };

  const getAssetValue = (assetId: string | null) => {
    if (!assetId) return null;
    const asset = assets.find((a) => a.id === assetId);
    return asset?.current_value || null;
  };

  const calculateProgress = (milestone: WealthMilestone) => {
    if (milestone.milestone_type === "portfolio") {
      return Math.min((currentPortfolioValue / milestone.target_value) * 100, 100);
    }
    
    if (milestone.asset_id) {
      const assetValue = getAssetValue(milestone.asset_id);
      if (assetValue !== null) {
        if (milestone.milestone_type === "sell") {
          return Math.min((assetValue / milestone.target_value) * 100, 100);
        }
      }
    }
    
    return Math.min((currentPortfolioValue / milestone.target_value) * 100, 100);
  };

  const activeMilestones = milestones.filter((m) => m.status === "active");
  const completedMilestones = milestones.filter((m) => m.status !== "active");

  // Group active milestones by type
  const groupedActiveMilestones = activeMilestones.reduce((acc, milestone) => {
    const type = milestone.milestone_type || "portfolio";
    if (!acc[type]) acc[type] = [];
    acc[type].push(milestone);
    return acc;
  }, {} as Record<string, WealthMilestone[]>);

  const typeOrder = ["sell", "buy", "portfolio"];

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

      {/* Active Milestones grouped by type */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Milestone</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Valor Alvo</TableHead>
              <TableHead className="w-[180px]">Progresso</TableHead>
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
              typeOrder.map((type) => {
                const milestonesOfType = groupedActiveMilestones[type];
                if (!milestonesOfType || milestonesOfType.length === 0) return null;

                const typeCfg = typeConfig[type];
                const TypeIcon = typeCfg.icon;

                return (
                  <React.Fragment key={`group-${type}`}>
                    {/* Type Header Row */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={7} className="font-semibold">
                        <div className="flex items-center gap-2">
                          <TypeIcon className={cn("h-4 w-4", typeCfg.color)} />
                          {typeCfg.label} ({milestonesOfType.length})
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Milestones of this type */}
                    {milestonesOfType.map((milestone) => {
                      const progress = calculateProgress(milestone);
                      const statusCfg = statusConfig[milestone.status || "active"];
                      const StatusIcon = statusCfg.icon;
                      const assetName = getAssetName(milestone.asset_id);
                      const remaining = milestone.target_value - (milestone.milestone_type === "portfolio" ? currentPortfolioValue : (getAssetValue(milestone.asset_id) || 0));

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
                            {assetName ? (
                              <Badge variant="outline" className="text-xs">
                                {assetName}
                              </Badge>
                            ) : milestone.category ? (
                              <span className="text-sm text-muted-foreground">{milestone.category}</span>
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
                                <span>{remaining > 0 ? `${formatCurrency(remaining)} restante` : "Meta atingida!"}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {milestone.target_date
                              ? format(new Date(milestone.target_date), "dd MMM yyyy", { locale: pt })
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs gap-1", statusCfg.color)}>
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
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
                    })}
                  </React.Fragment>
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
                const typeCfg = typeConfig[milestone.milestone_type || "portfolio"];
                const TypeIcon = typeCfg.icon;

                return (
                  <TableRow key={milestone.id} className="opacity-60">
                    <TableCell className="w-[60px]">
                      <TypeIcon className={cn("h-4 w-4", typeCfg.color)} />
                    </TableCell>
                    <TableCell className="font-medium">{milestone.name}</TableCell>
                    <TableCell>{getAssetName(milestone.asset_id) || milestone.category || "—"}</TableCell>
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
