
import React from "react";
import { Link2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface RelatedNote {
  id: string;
  title: string;
  category: string | null;
}

interface RelationsIndicatorProps {
  noteId: string;
  onClick?: () => void;
}

const RelationsIndicator: React.FC<RelationsIndicatorProps> = ({ noteId, onClick }) => {
  const navigate = useNavigate();

  // Fetch related notes with their details
  const { data: relatedNotes = [] } = useQuery({
    queryKey: ['note-relations-list', noteId],
    queryFn: async () => {
      // Get relations where this note is source or target
      const { data: relations, error } = await supabase
        .from('note_relations')
        .select('source_note_id, target_note_id')
        .or(`source_note_id.eq.${noteId},target_note_id.eq.${noteId}`);
      
      if (error) {
        console.error('Error fetching relations:', error);
        return [];
      }

      if (!relations || relations.length === 0) return [];

      // Get the IDs of related notes (the "other" note in each relation)
      const relatedIds = relations.map(r => 
        r.source_note_id === noteId ? r.target_note_id : r.source_note_id
      );

      // Fetch note details
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id, title, category')
        .in('id', relatedIds);

      if (notesError) {
        console.error('Error fetching related notes:', notesError);
        return [];
      }

      return (notes || []) as RelatedNote[];
    },
    enabled: !!noteId,
    staleTime: 30 * 1000,
  });

  const count = relatedNotes.length;

  if (count === 0) return null;

  const handleOpenNote = (relatedNoteId: string) => {
    navigate(`/editor/${relatedNoteId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 text-xs h-7 px-2"
        >
          <Link2 size={14} className="text-primary" />
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {count}
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">Relations</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {relatedNotes.map((note) => (
          <DropdownMenuItem
            key={note.id}
            onClick={() => handleOpenNote(note.id)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{note.title || "Untitled"}</p>
              {note.category && (
                <p className="text-xs text-muted-foreground">{note.category}</p>
              )}
            </div>
            <ExternalLink size={14} className="text-muted-foreground flex-shrink-0" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RelationsIndicator;
