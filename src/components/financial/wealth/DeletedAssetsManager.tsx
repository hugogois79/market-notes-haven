import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface DeletedAsset {
  id: string;
  name: string;
  category: string | null;
  current_value: number | null;
  deleted_at: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function DeletedAssetsManager() {
  const queryClient = useQueryClient();
  const [assetToDelete, setAssetToDelete] = useState<DeletedAsset | null>(null);

  const { data: deletedAssets = [], isLoading } = useQuery({
    queryKey: ["deleted-wealth-assets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wealth_assets")
        .select("id, name, category, current_value, deleted_at")
        .eq("user_id", user.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      return (data || []) as DeletedAsset[];
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wealth_assets")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleted-wealth-assets"] });
      queryClient.invalidateQueries({ queryKey: ["wealth-assets"] });
      queryClient.invalidateQueries({ queryKey: ["wealth-assets-forecast"] });
      toast.success("Ativo restaurado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao restaurar ativo");
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wealth_assets")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleted-wealth-assets"] });
      toast.success("Ativo eliminado permanentemente");
      setAssetToDelete(null);
    },
    onError: () => {
      toast.error("Erro ao eliminar ativo");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (deletedAssets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Não existem ativos eliminados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ativos Eliminados</h3>
        <p className="text-sm text-muted-foreground">
          {deletedAssets.length} ativo(s) na lixeira
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Eliminado em</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deletedAssets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>{asset.category || "—"}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(asset.current_value || 0)}
              </TableCell>
              <TableCell>
                {format(new Date(asset.deleted_at), "dd MMM yyyy, HH:mm", { locale: pt })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => restoreMutation.mutate(asset.id)}
                    disabled={restoreMutation.isPending}
                    title="Restaurar ativo"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setAssetToDelete(asset)}
                    disabled={permanentDeleteMutation.isPending}
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que pretende eliminar permanentemente o ativo{" "}
              <strong>{assetToDelete?.name}</strong> com valor de{" "}
              <strong>{formatCurrency(assetToDelete?.current_value || 0)}</strong>?
              <br /><br />
              Esta ação é irreversível e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => assetToDelete && permanentDeleteMutation.mutate(assetToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
