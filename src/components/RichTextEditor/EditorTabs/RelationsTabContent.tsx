import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, ExternalLink, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";

interface RelationsTabContentProps {
  noteId: string;
  onRelationChange?: () => void;
}

interface NoteRelation {
  id: string;
  source_note_id: string;
  target_note_id: string;
  relation_type: string;
  description: string | null;
  created_at: string;
}

interface Note {
  id: string;
  title: string;
  category: string | null;
  summary: string | null;
  created_at: string;
}

const RelationsTabContent: React.FC<RelationsTabContentProps> = ({ noteId, onRelationChange }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch all notes for searching
  const { data: allNotes = [] } = useQuery({
    queryKey: ['notes-for-relations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, category, summary, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    },
    staleTime: 30 * 1000,
  });

  // Fetch existing relations for this note
  const { data: relations = [], isLoading: isLoadingRelations } = useQuery({
    queryKey: ['note-relations', noteId],
    queryFn: async () => {
      if (!noteId) return [];
      
      const { data, error } = await supabase
        .from('note_relations')
        .select('*')
        .or(`source_note_id.eq.${noteId},target_note_id.eq.${noteId}`);
      
      if (error) throw error;
      return data as NoteRelation[];
    },
    enabled: !!noteId,
  });

  // Create relation mutation
  const createRelationMutation = useMutation({
    mutationFn: async (targetNoteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('note_relations')
        .insert({
          source_note_id: noteId,
          target_note_id: targetNoteId,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-relations', noteId] });
      queryClient.invalidateQueries({ queryKey: ['note-relations-count', noteId] });
      toast.success('Relação criada');
      setSearchQuery("");
      onRelationChange?.();
    },
    onError: (error: Error) => {
      if (error.message.includes('unique')) {
        toast.error('Esta relação já existe');
      } else {
        toast.error('Erro ao criar relação');
      }
    },
  });

  // Delete relation mutation
  const deleteRelationMutation = useMutation({
    mutationFn: async (relationId: string) => {
      const { error } = await supabase
        .from('note_relations')
        .delete()
        .eq('id', relationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-relations', noteId] });
      queryClient.invalidateQueries({ queryKey: ['note-relations-count', noteId] });
      toast.success('Relação removida');
      onRelationChange?.();
    },
    onError: () => {
      toast.error('Erro ao remover relação');
    },
  });

  // Get related note IDs from relations
  const relatedNoteIds = useMemo(() => {
    return relations.map(r => 
      r.source_note_id === noteId ? r.target_note_id : r.source_note_id
    );
  }, [relations, noteId]);

  // Filter notes for search results (exclude current note and already related)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return allNotes
      .filter(note => 
        note.id !== noteId && 
        !relatedNoteIds.includes(note.id) &&
        (note.title?.toLowerCase().includes(query) || 
         note.category?.toLowerCase().includes(query) ||
         note.summary?.toLowerCase().includes(query))
      )
      .slice(0, 5);
  }, [allNotes, searchQuery, noteId, relatedNoteIds]);

  // Get related notes with their details
  const relatedNotes = useMemo(() => {
    return relations.map(relation => {
      const relatedNoteId = relation.source_note_id === noteId 
        ? relation.target_note_id 
        : relation.source_note_id;
      const note = allNotes.find(n => n.id === relatedNoteId);
      return { relation, note };
    }).filter(item => item.note);
  }, [relations, allNotes, noteId]);

  const handleOpenNote = (targetNoteId: string) => {
    window.open(`/editor/${targetNoteId}`, '_blank');
  };

  if (!noteId) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Guarde a nota primeiro para adicionar relações
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-2 h-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Procurar notas para relacionar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border rounded-md bg-muted/30">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
            Resultados
          </div>
          <div className="max-h-32 overflow-y-auto">
            {searchResults.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-muted/50 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{note.title}</div>
                  {note.category && (
                    <div className="text-xs text-muted-foreground">{note.category}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => createRelationMutation.mutate(note.id)}
                  disabled={createRelationMutation.isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Notes */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Notas Relacionadas ({relatedNotes.length})
          </span>
        </div>

        {isLoadingRelations ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            A carregar...
          </div>
        ) : relatedNotes.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Nenhuma nota relacionada
          </div>
        ) : (
          <ScrollArea className="h-[calc(100%-24px)]">
            <div className="space-y-2 pr-2">
              {relatedNotes.map(({ relation, note }) => (
                <div
                  key={relation.id}
                  className="border rounded-md p-2 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{note?.title}</div>
                      {note?.category && (
                        <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground mt-1">
                          {note.category}
                        </span>
                      )}
                      {note?.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {note.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleOpenNote(note!.id)}
                        title="Abrir nota"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => deleteRelationMutation.mutate(relation.id)}
                        disabled={deleteRelationMutation.isPending}
                        title="Remover relação"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default RelationsTabContent;
