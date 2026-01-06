import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface AssetNote {
  id: string;
  asset_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

interface WealthAssetNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetName: string;
}

export default function WealthAssetNotesDialog({
  open,
  onOpenChange,
  assetId,
  assetName,
}: WealthAssetNotesDialogProps) {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["asset-notes", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_asset_notes")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AssetNote[];
    },
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("wealth_asset_notes").insert({
        asset_id: assetId,
        user_id: user.id,
        title: newTitle || null,
        content: newContent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-notes", assetId] });
      setNewTitle("");
      setNewContent("");
      setIsAdding(false);
      toast.success("Nota adicionada");
    },
    onError: () => {
      toast.error("Erro ao adicionar nota");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("wealth_asset_notes")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-notes", assetId] });
      toast.success("Nota eliminada");
    },
    onError: () => {
      toast.error("Erro ao eliminar nota");
    },
  });

  const handleAdd = () => {
    if (!newContent.trim()) {
      toast.error("Conteúdo é obrigatório");
      return;
    }
    addMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas de Research — {assetName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Note Form */}
          {isAdding ? (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <Input
                placeholder="Título (opcional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Textarea
                placeholder="Escreva a sua nota de research..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle("");
                    setNewContent("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? "A guardar..." : "Guardar Nota"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nota
            </Button>
          )}

          {/* Notes List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                A carregar notas...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Sem notas de research. Adicione a primeira nota.
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="border rounded-lg p-4 space-y-2 bg-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {note.title && (
                          <h4 className="font-semibold text-sm">{note.title}</h4>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), "dd MMM yyyy, HH:mm", {
                            locale: pt,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive shrink-0"
                        onClick={() => deleteMutation.mutate(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}