
import { useState, useCallback } from "react";
import { Tag, Token, Note, TradeInfo } from "@/types";
import { toast } from "sonner";
import { createTag, fetchTags } from "@/services/tag";
import { useQuery } from "@tanstack/react-query";

export function useEditorState({
  initialContent,
  initialTitle,
  initialTags,
  initialTokens = [],
  initialCategory,
  onSave,
  autoSave = false,
  onContentChange,
  onTitleChange,
  onTagsChange,
  onTokensChange = () => {},
  onCategoryChange,
  onSummaryGenerated,
  onTradeInfoChange = () => {},
  availableTagsForSelection,
}: {
  initialContent: string;
  initialTitle: string;
  initialTags: Tag[];
  initialTokens?: Token[];
  initialCategory: string;
  onSave?: () => void;
  autoSave?: boolean;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: Tag[]) => void;
  onTokensChange?: (tokens: Token[]) => void;
  onCategoryChange: (category: string) => void;
  onSummaryGenerated?: (summary: string, hasConclusion?: boolean) => void;
  onTradeInfoChange?: (tradeInfo: TradeInfo) => void;
  availableTagsForSelection?: Tag[];
}) {
  const [tagInput, setTagInput] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentContent, setCurrentContent] = useState(initialContent);
  
  const { data: fetchedTags = [], isLoading: isLoadingTags, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    enabled: !availableTagsForSelection,
  });

  const handleContentUpdate = useCallback((newContent: string) => {
    setCurrentContent(newContent);
  }, []);

  const handleAutoSave = useCallback(() => {
    if (autoSave && onSave) {
      onSave();
      setLastSaved(new Date());
    }
  }, [autoSave, onSave]);

  const handleManualSave = () => {
    if (onSave) {
      onSave();
      setLastSaved(new Date());
    }
  };

  const handleContentChange = () => {
    onContentChange(currentContent);
  };

  const handleTitleChange = useCallback((newTitle: string) => {
    console.log("RichTextEditor received title change:", newTitle);
    onTitleChange(newTitle);
    
    if (autoSave && onSave) {
      setTimeout(() => {
        onSave();
        setLastSaved(new Date());
      }, 500);
    }
  }, [autoSave, onSave, onTitleChange]);

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    
    const tagName = tagInput.trim();
    
    // Check if tag with this name already exists in initialTags (case insensitive)
    const tagExists = initialTags.some((tag) => {
      // First check if tag is defined
      if (!tag) return false;
      
      if (typeof tag === 'string') {
        // For string tags, verify both values are strings before comparing
        return typeof tagName === 'string' && tag.toLowerCase() === tagName.toLowerCase();
      }
      
      // For Tag objects with proper type checking
      if (tag && typeof tag === 'object' && tag.name && typeof tag.name === 'string') {
        return typeof tagName === 'string' && tag.name.toLowerCase() === tagName.toLowerCase();
      }
      
      return false;
    });
    
    if (!tagExists) {
      try {
        const tagsToSearch = availableTagsForSelection || fetchedTags;
        
        // Check if tag exists in available tags (case insensitive)
        const existingTag = tagsToSearch.find(tag => {
          // First check if tag is defined
          if (!tag) return false;
          
          // Then check if it has a name property that's a string
          if (tag && typeof tag === 'object' && tag.name && typeof tag.name === 'string') {
            return typeof tagName === 'string' && tag.name.toLowerCase() === tagName.toLowerCase();
          }
          
          return false;
        });
        
        if (existingTag) {
          onTagsChange([...initialTags, existingTag]);
        } else {
          const newTag = await createTag(tagName, initialCategory);
          if (newTag) {
            onTagsChange([...initialTags, newTag]);
            refetchTags();
            toast.success(`Created tag "${tagName}" in category "${initialCategory}"`);
          } else {
            toast.error("Failed to create tag");
          }
        }
      } catch (error) {
        console.error("Error adding tag:", error);
        toast.error("Failed to add tag");
      }
    } else {
      toast.info("Tag already added to this note");
    }
    
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string | Tag) => {
    const tagId = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.id;
    const updatedTags = initialTags.filter(tag => 
      typeof tag === 'string' ? tag !== tagId : tag.id !== tagId
    );
    
    onTagsChange(updatedTags);
  };

  const handleSelectTag = (tag: Tag) => {
    // Check if tag already exists in initialTags by comparing id (more reliable than name)
    const tagExists = initialTags.some(t => 
      typeof t === 'string' ? t === tag.id : t.id === tag.id
    );
    
    if (!tagExists) {
      onTagsChange([...initialTags, tag]);
    } else {
      toast.info("Tag already added to this note");
    }
    
    setTagInput("");
  };

  const getAvailableTagsForSelection = () => {
    const tagsToFilter = availableTagsForSelection || fetchedTags;
    if (!tagsToFilter || !Array.isArray(tagsToFilter)) {
      return [];
    }
    
    return tagsToFilter.filter(tag => 
      tag && initialTags.some(linkedTag => 
        typeof linkedTag === 'string' 
          ? linkedTag === tag.id 
          : linkedTag.id === tag.id
      ) === false
    );
  };

  return {
    tagInput,
    setTagInput,
    lastSaved,
    setLastSaved,
    currentContent,
    handleContentUpdate,
    handleAutoSave,
    handleManualSave,
    handleContentChange,
    handleTitleChange,
    handleAddTag,
    handleRemoveTag,
    handleSelectTag,
    getAvailableTagsForSelection,
    isLoadingTags,
    fetchedTags
  };
}
