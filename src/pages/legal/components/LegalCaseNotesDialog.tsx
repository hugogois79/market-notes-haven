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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Search, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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

interface LegalCaseNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseTitle: string;
}

export default function LegalCaseNotesDialog({
  open,
  onOpenChange,
  caseId,
  caseTitle,
}: LegalCaseNotesDialogProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch linked notes
  const { data: linkedNotes = [], isLoading: loadingLinked } = useQuery({
    queryKey: ["case-linked-notes", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_case_note_links")
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
        .eq("case_id", caseId)
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

  // Link note mutation
  const linkNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("legal_case_note_links").insert({
        case_id: caseId,
        note_id: noteId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-linked-notes", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case-notes-count"] });
      setSearchQuery("");
      toast.success("Nota anexada ao caso");
    },
    onError: () => {
      toast.error("Erro ao anexar nota");
    },
  });

  // Unlink note mutation
  const unlinkNoteMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("legal_case_note_links")
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-linked-notes", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case-notes-count"] });
      toast.success("Nota desanexada");
    },
    onError: () => {
      toast.error("Erro ao desanexar nota");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas — {caseTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* Search Bar */}
          <div className="relative shrink-0">
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
            <div className="border rounded-lg p-2 bg-muted/30 max-h-[180px] overflow-y-auto shrink-0">
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
          <div className="flex-1 min-h-0 flex flex-col">
            <h4 className="text-sm font-medium mb-2 shrink-0">Notas Anexadas ({linkedNotes.length})</h4>
            <ScrollArea className="flex-1">
              {loadingLinked ? (
                <div className="text-center py-8 text-muted-foreground">
                  A carregar notas...
                </div>
              ) : linkedNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Sem notas anexadas. Use a pesquisa acima para anexar notas existentes.
                </div>
              ) : (
                <div className="space-y-2 pr-2">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
