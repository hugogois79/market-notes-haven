import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface WealthMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: WealthMilestone | null;
}

type FormData = {
  name: string;
  description: string;
  target_value: string;
  target_date: string;
  category: string;
  status: string;
  achieved_date: string;
  asset_id: string;
  milestone_type: string;
};

const CATEGORIES = [
  "Real Estate",
  "Vehicles",
  "Marine",
  "Art",
  "Watches",
  "Crypto",
  "Private Equity",
  "Cash",
  "Global",
];

const MILESTONE_TYPES = [
  { value: "portfolio", label: "Meta Portfolio" },
  { value: "buy", label: "Comprar Ativo" },
  { value: "sell", label: "Vender Ativo" },
];

export default function WealthMilestoneDialog({
  open,
  onOpenChange,
  milestone,
}: WealthMilestoneDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!milestone;

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
      description: "",
      target_value: "",
      target_date: "",
      category: "",
      status: "active",
      achieved_date: "",
      asset_id: "",
      milestone_type: "portfolio",
    },
  });

  const status = watch("status");
  const milestoneType = watch("milestone_type");
  const selectedAssetId = watch("asset_id");

  // Fetch assets for the dropdown
  const { data: assets = [] } = useQuery({
    queryKey: ["wealth-assets-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_assets")
        .select("id, name, category, current_value")
        .order("name");

      if (error) throw error;
      return data as WealthAsset[];
    },
  });

  // Auto-fill name when asset is selected
  useEffect(() => {
    if (selectedAssetId && !isEditing) {
      const asset = assets.find((a) => a.id === selectedAssetId);
      if (asset) {
        const currentName = watch("name");
        if (!currentName) {
          const typeLabel = milestoneType === "sell" ? "Vender" : "Comprar";
          setValue("name", `${typeLabel} ${asset.name}`);
        }
        setValue("category", asset.category);
      }
    }
  }, [selectedAssetId, assets, isEditing, milestoneType, setValue, watch]);

  useEffect(() => {
    if (milestone) {
      reset({
        name: milestone.name,
        description: milestone.description || "",
        target_value: milestone.target_value.toString(),
        target_date: milestone.target_date || "",
        category: milestone.category || "",
        status: milestone.status || "active",
        achieved_date: milestone.achieved_date || "",
        asset_id: milestone.asset_id || "",
        milestone_type: milestone.milestone_type || "portfolio",
      });
    } else {
      reset({
        name: "",
        description: "",
        target_value: "",
        target_date: "",
        category: "",
        status: "active",
        achieved_date: "",
        asset_id: "",
        milestone_type: "portfolio",
      });
    }
  }, [milestone, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        target_value: parseFloat(data.target_value.replace(/[^\d.-]/g, "")),
        target_date: data.target_date || null,
        category: data.category || null,
        status: data.status,
        achieved_date: data.status === "achieved" ? (data.achieved_date || format(new Date(), "yyyy-MM-dd")) : null,
        asset_id: data.asset_id || null,
        milestone_type: data.milestone_type,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("wealth_milestones")
          .update(payload)
          .eq("id", milestone.id);
        if (error) throw error;
      } else {
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase.from("wealth_milestones").insert({
          ...payload,
          user_id: user.user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wealth-milestones"] });
      toast.success(isEditing ? "Milestone atualizado" : "Milestone criado");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao guardar milestone");
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Milestone" : "Novo Milestone"}</DialogTitle>
          <DialogDescription>
            Defina um objetivo financeiro para acompanhar o seu progresso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            {/* Milestone Type */}
            <div className="space-y-2">
              <Label>Tipo de Milestone</Label>
              <Select
                value={watch("milestone_type")}
                onValueChange={(value) => setValue("milestone_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Asset Selection (for buy/sell milestones) */}
            {(milestoneType === "buy" || milestoneType === "sell") && (
              <div className="space-y-2">
                <Label>Ativo {milestoneType === "sell" ? "(a vender)" : "(a comprar)"}</Label>
                <Select
                  value={watch("asset_id")}
                  onValueChange={(value) => setValue("asset_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar ativo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Novo ativo (sem link)</SelectItem>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.category}) {asset.current_value ? `- ${formatCurrency(asset.current_value)}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Primeiro Milhão, Vender Barco"
                {...register("name", { required: "Nome é obrigatório" })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo..."
                rows={2}
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_value">
                  {milestoneType === "sell" ? "Valor de Venda (€)" : milestoneType === "buy" ? "Valor de Compra (€)" : "Valor Alvo (€)"} *
                </Label>
                <Input
                  id="target_value"
                  placeholder="1.000.000"
                  {...register("target_value", { required: "Valor é obrigatório" })}
                />
                {errors.target_value && (
                  <p className="text-xs text-destructive">{errors.target_value.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Data Alvo</Label>
                <Input
                  id="target_date"
                  type="date"
                  {...register("target_date")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={watch("category")}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="achieved">Atingido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {status === "achieved" && (
              <div className="space-y-2">
                <Label htmlFor="achieved_date">Data de Conclusão</Label>
                <Input
                  id="achieved_date"
                  type="date"
                  {...register("achieved_date")}
                />
              </div>
            )}
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
