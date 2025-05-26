
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
    if (isSaving) return; // Prevent multiple simultaneous save operations
    
    // Don't save if there are no changes
    if (Object.keys(changes).length === 0) {
      console.log("No changes to save");
      return;
    }
    
    console.log("Saving changes:", changes);
    setIsSaving(true);
    
    try {
      // Ensure we're sending valid data types for all fields
      const validatedChanges = {
        ...changes,
        title: changes.title !== undefined ? changes.title : undefined,
        category: changes.category !== undefined ? changes.category : undefined, // Ensure category is passed through
        // Important: Ensure tags are properly processed
        tags: changes.tags !== undefined ? 
          (Array.isArray(changes.tags) ? changes.tags : 
            (changes.tags ? [changes.tags] : [])) : undefined,
        // Important: Ensure attachments are properly processed
        attachments: changes.attachments !== undefined ? 
          (Array.isArray(changes.attachments) ? changes.attachments : 
            (changes.attachments ? [changes.attachments] : [])) : undefined,
      };
      
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
  
  const handleTitleChange = (title: string) => {
    console.log("useSaveNote: Setting title change:", title);
    
    // Set in pending changes
    setPendingChanges(prev => ({ ...prev, title }));
    
    // Always immediately save title changes
    handleSaveWithChanges({ title }, false);
  };

  return {
    isSaving,
    pendingChanges,
    handleSaveWithChanges,
    handleManualSave,
    handleContentChange,
    handleTitleChange
  };
};
