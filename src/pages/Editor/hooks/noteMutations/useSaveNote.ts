
import { useState, useRef, useCallback } from "react";
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
      if (isSaving) return;
      
      const changesToSave = { ...pendingChangesRef.current };
      pendingChangesRef.current = {};
    
      if (Object.keys(changesToSave).length === 0) {
        return;
      }
      
      setIsSaving(true);
      
      try {
        const validatedChanges: Partial<Note> = {};
        
        // Only include fields that are explicitly passed in changes
        if ('title' in changesToSave) {
          validatedChanges.title = changesToSave.title;
        }
        if ('category' in changesToSave) {
          validatedChanges.category = changesToSave.category;
        }
        if ('content' in changesToSave) {
          validatedChanges.content = changesToSave.content;
        }
        if ('tags' in changesToSave) {
          validatedChanges.tags = Array.isArray(changesToSave.tags) ? changesToSave.tags : 
            (changesToSave.tags ? [changesToSave.tags] : []);
        }
        if ('attachments' in changesToSave) {
          validatedChanges.attachments = Array.isArray(changesToSave.attachments) ? changesToSave.attachments : 
            (changesToSave.attachments ? [changesToSave.attachments] : []);
        }
        if ('attachment_url' in changesToSave) {
          validatedChanges.attachment_url = changesToSave.attachment_url;
        }
        if ('project_id' in changesToSave) {
          validatedChanges.project_id = changesToSave.project_id;
        }
        if ('summary' in changesToSave) {
          validatedChanges.summary = changesToSave.summary;
        }
        if ('tradeInfo' in changesToSave) {
          validatedChanges.tradeInfo = changesToSave.tradeInfo;
        }
        if ('hasConclusion' in changesToSave) {
          validatedChanges.hasConclusion = changesToSave.hasConclusion;
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
        setIsSaving(false);
      }
    }, delay);
  }, [onSave, isSaving]);

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
