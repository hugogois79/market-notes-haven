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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, Search, Link, ExternalLink } from "lucide-react";
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

interface Note {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  summary: string | null;
  created_at: string | null;
  tags: string[] | null;
}

interface LinkedNote {
  id: string;
  note_id: string;
  created_at: string;
  notes: Note;
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
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch research notes (wealth_asset_notes)
  const { data: researchNotes = [], isLoading: loadingResearch } = useQuery({
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

  // Fetch linked notes (wealth_asset_note_links)
  const { data: linkedNotes = [], isLoading: loadingLinked } = useQuery({
    queryKey: ["asset-linked-notes", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_asset_note_links")
        .select(`
          id,
          note_id,
          created_at,
          notes (
            id,
            title,
            content,
            category,
            summary,
            created_at,
            tags
          )
        `)
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as LinkedNote[];
    },
    enabled: open,
  });

  // Search notes
  const { data: searchResults = [], isLoading: loadingSearch } = useQuery({
    queryKey: ["notes-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, category, summary, created_at, tags")
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Note[];
    },
    enabled: open && searchQuery.length >= 2,
  });

  // Filter out already linked notes
  const linkedNoteIds = linkedNotes.map(ln => ln.note_id);
  const filteredSearchResults = searchResults.filter(
    note => !linkedNoteIds.includes(note.id)
  );

  // Add research note mutation
  const addResearchMutation = useMutation({
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

  // Delete research note mutation
  const deleteResearchMutation = useMutation({
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

  // Link note mutation
  const linkNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("wealth_asset_note_links").insert({
        asset_id: assetId,
        note_id: noteId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-linked-notes", assetId] });
      toast.success("Nota anexada ao ativo");
    },
    onError: () => {
      toast.error("Erro ao anexar nota");
    },
  });

  // Unlink note mutation
  const unlinkNoteMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("wealth_asset_note_links")
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-linked-notes", assetId] });
      toast.success("Nota desanexada");
    },
    onError: () => {
      toast.error("Erro ao desanexar nota");
    },
  });

  const handleAddResearch = () => {
    if (!newContent.trim()) {
      toast.error("Conteúdo é obrigatório");
      return;
    }
    addResearchMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas — {assetName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="linked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="linked" className="gap-2">
              <Link className="h-4 w-4" />
              Notas Anexadas ({linkedNotes.length})
            </TabsTrigger>
            <TabsTrigger value="research" className="gap-2">
              <FileText className="h-4 w-4" />
              Research ({researchNotes.length})
            </TabsTrigger>
          </TabsList>

          {/* Linked Notes Tab */}
          <TabsContent value="linked" className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Procurar notas para anexar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="border rounded-lg p-2 bg-muted/30 max-h-[200px] overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2 px-2">
                  {loadingSearch ? "A procurar..." : `${filteredSearchResults.length} resultados`}
                </p>
                {filteredSearchResults.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer group"
                    onClick={() => linkNoteMutation.mutate(note.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{note.title}</p>
                      <div className="flex items-center gap-2">
                        {note.category && (
                          <Badge variant="outline" className="text-xs">
                            {note.category}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {note.created_at && format(new Date(note.created_at), "dd MMM yyyy", { locale: pt })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {filteredSearchResults.length === 0 && !loadingSearch && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Sem resultados
                  </p>
                )}
              </div>
            )}

            {/* Linked Notes List */}
            <ScrollArea className="h-[300px]">
              {loadingLinked ? (
                <div className="text-center py-8 text-muted-foreground">
                  A carregar notas...
                </div>
              ) : linkedNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Sem notas anexadas. Use a pesquisa acima para anexar notas existentes.
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedNotes.map((link) => (
                    <div
                      key={link.id}
                      className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {link.notes.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {link.notes.category && (
                              <Badge variant="outline" className="text-xs">
                                {link.notes.category}
                              </Badge>
                            )}
                            {link.notes.tags?.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {link.notes.summary && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {link.notes.summary}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(`/notes?id=${link.note_id}`, '_blank')}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => unlinkNoteMutation.mutate(link.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Research Notes Tab */}
          <TabsContent value="research" className="space-y-4">
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
                    onClick={handleAddResearch}
                    disabled={addResearchMutation.isPending}
                  >
                    {addResearchMutation.isPending ? "A guardar..." : "Guardar Nota"}
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
                Adicionar Nota de Research
              </Button>
            )}

            {/* Research Notes List */}
            <ScrollArea className="h-[350px]">
              {loadingResearch ? (
                <div className="text-center py-8 text-muted-foreground">
                  A carregar notas...
                </div>
              ) : researchNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Sem notas de research. Adicione a primeira nota.
                </div>
              ) : (
                <div className="space-y-3">
                  {researchNotes.map((note) => (
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
                          onClick={() => deleteResearchMutation.mutate(note.id)}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
