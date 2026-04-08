
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTaoNotes, linkNoteToTaoToken } from "@/services/taoTokenService";
import TaoNotes from "./TaoNotes";
import { Note } from "@/types";
import { useNotes } from "@/contexts/NotesContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface TaoNotesTabProps {
  validatorNames: Record<string, string>;
}

const TaoNotesTab: React.FC<TaoNotesTabProps> = ({ validatorNames }) => {
  const { notes, refetch: refetchAppNotes, handleSaveNote } = useNotes();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch TAO notes from Supabase
  const { 
    data: taoNotes, 
    isLoading: isLoadingTaoNotes,
    refetch: refetchTaoNotes
  } = useQuery({
    queryKey: ["tao-token-notes"],
    queryFn: getTaoNotes,
  });

  // Sync TAO notes with Supabase
  const syncTaoNotes = async () => {
    setIsSyncing(true);
    try {
      // Find any notes that have the TAO tag but aren't linked to the TAO token
      const taoTaggedNotes = notes.filter(note => 
        note.tags.includes("TAO") || 
        note.category === "TAO"
      );
      
      // Get the IDs of notes that are already linked to the TAO token
      const taoLinkedNoteIds = (taoNotes || []).map(note => note.id);
      
      // Find notes that need to be linked
      const notesToLink = taoTaggedNotes.filter(note => 
        !taoLinkedNoteIds.includes(note.id)
      );
      
      if (notesToLink.length === 0) {
        toast.info("All TAO notes are already synchronized");
        return;
      }
      
      // Link each note to the TAO token
      let successCount = 0;
      for (const note of notesToLink) {
        const success = await linkNoteToTaoToken(note.id);
        if (success) successCount++;
      }
      
      if (successCount > 0) {
        toast.success(`Synchronized ${successCount} TAO notes`);
        refetchTaoNotes();
        refetchAppNotes();
      } else {
        toast.error("Failed to synchronize notes");
      }
    } catch (error) {
      console.error("Error syncing TAO notes:", error);
      toast.error("An error occurred while synchronizing notes");
    } finally {
      setIsSyncing(false);
    }
  };

  // Set TAO tag on notes that don't have it but are linked to the TAO token
  useEffect(() => {
    const syncTagsWithLinkedNotes = async () => {
      if (!taoNotes || taoNotes.length === 0) return;
      
      // Find notes that are linked to TAO token but don't have the TAO tag
      const notesToTag = taoNotes.filter(taoNote => {
        const appNote = notes.find(note => note.id === taoNote.id);
        return appNote && !appNote.tags.includes("TAO");
      });
      
      // Add TAO tag to these notes
      for (const note of notesToTag) {
        const appNote = notes.find(n => n.id === note.id);
        if (appNote) {
          await handleSaveNote({
            ...appNote,
            tags: [...appNote.tags, "TAO"]
          });
        }
      }
      
      if (notesToTag.length > 0) {
        refetchAppNotes();
      }
    };
    
    syncTagsWithLinkedNotes();
  }, [taoNotes, notes, handleSaveNote, refetchAppNotes]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">TAO Notes</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={syncTaoNotes}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync Notes
        </Button>
      </div>
      
      {isLoadingTaoNotes || isSyncing ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent mb-2"></div>
            <p className="text-sm text-muted-foreground">
              {isSyncing ? "Synchronizing notes..." : "Loading TAO notes..."}
            </p>
          </div>
        </div>
      ) : (
        <TaoNotes validatorNames={validatorNames} />
      )}
    </div>
  );
};

export default TaoNotesTab;
