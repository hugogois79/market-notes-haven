
import React from "react";
import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RelationsIndicatorProps {
  noteId: string;
  onClick?: () => void;
}

const RelationsIndicator: React.FC<RelationsIndicatorProps> = ({ noteId, onClick }) => {
  const { data: count = 0 } = useQuery({
    queryKey: ['note-relations-count', noteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('note_relations')
        .select('*', { count: 'exact', head: true })
        .or(`source_note_id.eq.${noteId},target_note_id.eq.${noteId}`);
      
      if (error) {
        console.error('Error fetching relations count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!noteId,
    staleTime: 30 * 1000, // 30 seconds
  });

  if (!count || count === 0) return null;

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick}
      className="gap-1.5 text-xs h-7 px-2"
    >
      <Link2 size={14} className="text-primary" />
      <Badge variant="secondary" className="text-xs px-1.5 py-0">
        {count}
      </Badge>
      <span className="text-muted-foreground hidden sm:inline">Relações</span>
    </Button>
  );
};

export default RelationsIndicator;
