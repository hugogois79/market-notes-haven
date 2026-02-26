
import { useState, useRef, useCallback, useEffect } from "react";
import { Note } from "@/types";
import { toast } from "sonner";

interface UseSaveNoteProps {
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
}

export const useSaveNote = ({ onSave }: UseSaveNoteProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<Note>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Partial<Note>>({});
  const isSavingRef = useRef(false);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSaveWithChanges = useCallback(async (changes: Partial<Note>, isAutoSave = false) => {
    // Merge with any pending changes
    pendingChangesRef.current = { ...pendingChangesRef.current, ...changes };
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce: 100ms for manual actions, 500ms for auto-save
    const delay = isAutoSave ? 500 : 100;
    
    saveTimeoutRef.current = setTimeout(async () => {
      // Use ref to avoid stale closure over isSaving state
      if (isSavingRef.current) return;
      
      const changesToSave = { ...pendingChangesRef.current };
      pendingChangesRef.current = {};
    
      if (Object.keys(changesToSave).length === 0) {
        return;
      }
      
      isSavingRef.current = true;
      setIsSaving(true);
      
      try {
        // Pass through all fields that are explicitly in changesToSave
        const validatedChanges: Partial<Note> = {};
        
        const fieldKeys: (keyof Note)[] = [
          'title', 'category', 'content', 'summary',
          'attachment_url', 'project_id', 'tradeInfo', 'hasConclusion'
        ];
        
        for (const key of fieldKeys) {
          if (key in changesToSave) {
            (validatedChanges as any)[key] = changesToSave[key];
          }
        }
        
        if ('tags' in changesToSave) {
          validatedChanges.tags = Array.isArray(changesToSave.tags) ? changesToSave.tags : 
            (changesToSave.tags ? [changesToSave.tags] : []);
        }
        if ('attachments' in changesToSave) {
          validatedChanges.attachments = Array.isArray(changesToSave.attachments) ? changesToSave.attachments : 
            (changesToSave.attachments ? [changesToSave.attachments] : []);
        }
        
        await onSave(validatedChanges);
        
        // Clear pending changes that were just saved
        setPendingChanges(prev => {
          const updated = {...prev};
          Object.keys(changesToSave).forEach(key => {
            delete updated[key as keyof Note];
          });
          return updated;
        });
        
        if (!isAutoSave) {
          toast.success("Nota guardada");
        }
      } catch (error) {
        console.error("Error saving note:", error);
        toast.error("Failed to save note");
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }, delay);
  }, [onSave]);

  const handleManualSave = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    await handleSaveWithChanges(pendingChanges, false);
  };

  const handleContentChange = (content: string) => {
    setPendingChanges(prev => ({ ...prev, content }));
  };

  return {
    isSaving,
    pendingChanges,
    handleSaveWithChanges,
    handleManualSave,
    handleContentChange
  };
};
