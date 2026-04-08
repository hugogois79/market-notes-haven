
import { Note, Tag, Token, TradeInfo } from "@/types";
import { useAttachments } from "./noteMutations/useAttachments";
import { useBasicNoteFields } from "./noteMutations/useBasicNoteFields";
import { useSaveNote } from "./noteMutations/useSaveNote";
import { useTagsAndTokens } from "./noteMutations/useTagsAndTokens";

interface UseNoteMutationsProps {
  currentNote: Note;
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
}

export const useNoteMutations = ({ currentNote, onSave }: UseNoteMutationsProps) => {
  const { attachments, handleAttachmentChange } = useAttachments(currentNote);
  
  const {
    localTitle,
    localCategory,
    localTradeInfo,
    hasConclusion,
    summaryState,
    localProjectId,
    handleTitleChange,
    handleCategoryChange,
    handleTradeInfoChange,
    handleSummaryGenerated,
    handleProjectChange
  } = useBasicNoteFields(currentNote);

  const {
    linkedTags,
    linkedTokens,
    handleTagsChange,
    handleTokensChange
  } = useTagsAndTokens({
    noteId: currentNote.id,
    initialTags: currentNote.tags?.map(tag => {
      // Handle both string and Tag object formats
      if (typeof tag === 'string') {
        return { id: tag, name: tag, category: null, categories: [] };
      }
      // Explicitly cast tag as any to allow property access
      const tagObj = tag as any;
      // Ensure the tag objects have the required properties
      return {
        id: tagObj?.id || '',
        name: tagObj?.name || '',
        category: tagObj?.category || null,
        categories: []
      };
    }) as Tag[] || []
  });

  const {
    isSaving,
    pendingChanges,
    handleSaveWithChanges,
    handleManualSave,
    handleContentChange: rawContentChange
  } = useSaveNote({ 
    onSave: async (updatedFields) => {
      console.log("useNoteMutations: Saving fields to database:", updatedFields);
      return onSave(updatedFields);
    }
  });

  // Wrap content change to always include title and category for safety
  const handleContentChangeWithContext = (content: string) => {
    rawContentChange(content);
  };

  // Handler that saves summary immediately along with current local state
  const handleSummaryGeneratedAndSave = (summary: string, conclusion?: boolean) => {
    console.log("useNoteMutations: Summary generated, saving with current state");
    handleSummaryGenerated(summary, conclusion);
    
    // Save immediately including the current local state
    handleSaveWithChanges({
      ...pendingChanges,
      title: localTitle,           // Preserve current title
      category: localCategory,     // Preserve current category
      summary: summary,
      hasConclusion: conclusion ?? true
    }, false);
  };

  // Title change handler - no auto-save, included in manual save
  const handleTitleChangeOnly = (title: string) => {
    console.log("useNoteMutations: Title change (local):", title);
    handleTitleChange(title);
  };

  // Category change handler - no auto-save, included in manual save
  const handleCategoryChangeOnly = (category: string) => {
    console.log("useNoteMutations: Category change (local):", category);
    handleCategoryChange(category);
  };

  // Enhanced manual save that ALWAYS includes title, category and content
  const handleManualSaveWithCurrentState = async () => {
    const fieldsToSave: Partial<Note> = {
      title: localTitle || currentNote.title || "Untitled Note",
      category: localCategory || currentNote.category || "General",
      ...pendingChanges,
    };
    
    console.log("Manual save with current state:", fieldsToSave);
    await handleSaveWithChanges(fieldsToSave, false);
  };

  // Override tags change to save immediately (since tags are usually intentional actions)
  const handleTagsChangeAndSave = (tags: Tag[] | string[]) => {
    // Update UI immediately
    handleTagsChange(tags);
    
    const processedTags = tags.map(tag => {
      if (typeof tag === 'string') {
        return tag;
      }
      return tag.name || tag.id || String(tag);
    });
    
    // Use localCategory if available, fallback to currentNote.category
    const categoryToSave = localCategory || currentNote.category || "General";
    
    // Save in background - non-blocking for faster UI response
    Promise.resolve().then(() => {
      handleSaveWithChanges({ 
        ...pendingChanges,
        tags: processedTags,
        category: categoryToSave
      }, false);
    });
  };

  // Handle attachment change and save immediately
  const handleAttachmentChangeAndSave = (attachmentData: string | null) => {
    const result = handleAttachmentChange(attachmentData);
    if (result) {
      console.log("Saving attachment change:", result);
      console.log("Including pending changes:", pendingChanges);
      handleSaveWithChanges({
        ...pendingChanges, // Include pending content and other changes
        attachment_url: result.attachment_url,
        attachments: result.attachments
      }, false);
    }
  };

  // Handle project change and save immediately - non-blocking
  const handleProjectChangeAndSave = (projectId: string | null) => {
    // Update UI immediately
    handleProjectChange(projectId);
    
    // Save in background - non-blocking for faster UI response
    Promise.resolve().then(() => {
      handleSaveWithChanges({ 
        ...pendingChanges,
        project_id: projectId 
      }, false);
    });
  };

  return {
    // State
    isSaving,
    pendingChanges,
    localTitle,
    localCategory,
    localTradeInfo,
    hasConclusion,
    summaryState,
    attachments,
    linkedTags,
    linkedTokens,
    localProjectId,

    // Handlers - no auto-save for title/category
    handleTitleChange: handleTitleChangeOnly,
    handleContentChange: handleContentChangeWithContext,
    handleCategoryChange: handleCategoryChangeOnly,
    handleSummaryGenerated: handleSummaryGeneratedAndSave,
    handleTradeInfoChange,
    handleAttachmentChange: handleAttachmentChangeAndSave,
    handleSaveWithChanges,
    handleManualSave: handleManualSaveWithCurrentState,
    handleTagsChange: handleTagsChangeAndSave,
    handleTokensChange,
    handleProjectChange: handleProjectChangeAndSave
  };
};
