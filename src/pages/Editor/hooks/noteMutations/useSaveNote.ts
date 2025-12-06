
import { useState } from "react";
import { Note } from "@/types";
import { toast } from "sonner";

interface UseSaveNoteProps {
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
}

export const useSaveNote = ({ onSave }: UseSaveNoteProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<Note>>({});

  const handleSaveWithChanges = async (changes: Partial<Note>, isAutoSave = false) => {
    if (isSaving) return;
    
    if (Object.keys(changes).length === 0) {
      console.log("No changes to save");
      return;
    }
    
    console.log("Saving changes:", changes);
    setIsSaving(true);
    
    try {
      const validatedChanges: Partial<Note> = {};
      
      // Only include fields that are explicitly passed in changes
      if ('title' in changes) {
        validatedChanges.title = changes.title;
      }
      if ('category' in changes) {
        validatedChanges.category = changes.category;
      }
      if ('content' in changes) {
        validatedChanges.content = changes.content;
      }
      if ('tags' in changes) {
        validatedChanges.tags = Array.isArray(changes.tags) ? changes.tags : 
          (changes.tags ? [changes.tags] : []);
      }
      if ('attachments' in changes) {
        validatedChanges.attachments = Array.isArray(changes.attachments) ? changes.attachments : 
          (changes.attachments ? [changes.attachments] : []);
      }
      if ('attachment_url' in changes) {
        validatedChanges.attachment_url = changes.attachment_url;
      }
      if ('project_id' in changes) {
        validatedChanges.project_id = changes.project_id;
      }
      if ('summary' in changes) {
        validatedChanges.summary = changes.summary;
      }
      if ('tradeInfo' in changes) {
        validatedChanges.tradeInfo = changes.tradeInfo;
      }
      if ('hasConclusion' in changes) {
        validatedChanges.hasConclusion = changes.hasConclusion;
      }
      
      console.log("Saving note with validated changes:", validatedChanges);
      
      await onSave(validatedChanges);
      
      // Clear pending changes that were just saved
      setPendingChanges(prev => {
        const updated = {...prev};
        Object.keys(changes).forEach(key => {
          delete updated[key as keyof Note];
        });
        return updated;
      });
      
      if (!isAutoSave) {
        if (changes.title !== undefined) {
          toast.success("Title saved successfully");
        } else if (changes.category !== undefined) {
          toast.success("Category saved successfully");
        } else {
          toast.success("Note saved successfully");
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

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
