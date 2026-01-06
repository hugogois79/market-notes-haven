import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
  created_at: string;
  updated_at: string;
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
    },
  });

  const status = watch("status");

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
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Primeiro Milhão"
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
                <Label htmlFor="target_value">Valor Alvo (€) *</Label>
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
