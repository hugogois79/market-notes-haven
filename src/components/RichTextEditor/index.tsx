import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Tag, Token, Note, TradeInfo } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchTags, createTag } from "@/services/tagService";
import { fetchTokens } from "@/services/tokenService";
import { toast } from "sonner";

// Import refactored components
import EditorHeader from "./EditorHeader";
import EditorStatusBar from "./EditorStatusBar";
import EditorTabs from "./EditorTabs";
import MetadataSection from "./MetadataSection";
import SpecialSections from "./SpecialSections";

interface RichTextEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  linkedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  linkedTokens?: Token[];
  onTokensChange?: (tokens: Token[]) => void;
  noteId?: string;
  attachment_url?: string;
  onAttachmentChange?: (url: string | null) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  onSave?: () => void; 
  autoSave?: boolean;
  isSaving?: boolean;
  manualSave?: () => void;
  summary?: string;
  onSummaryGenerated?: (summary: string, hasConclusion?: boolean) => void;
  tradeInfo?: TradeInfo;
  onTradeInfoChange?: (tradeInfo: TradeInfo) => void;
  hasConclusion?: boolean;
}

const RichTextEditor = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  linkedTags,
  onTagsChange,
  linkedTokens = [],
  onTokensChange = () => {},
  noteId = "",
  attachment_url,
  onAttachmentChange = () => {},
  category,
  onCategoryChange,
  onSave,
  autoSave = false,
  isSaving = false,
  manualSave,
  summary = "",
  onSummaryGenerated,
  tradeInfo,
  onTradeInfoChange = () => {},
  hasConclusion = true,
}: RichTextEditorProps) => {
  
  const [tagInput, setTagInput] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentContent, setCurrentContent] = useState(content);
  
  // Fetch available tags
  const { data: availableTags = [], isLoading: isLoadingTags, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  // Fetch available tokens
  const { data: availableTokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
  });

  // Handle content updates from editor
  const handleContentUpdate = useCallback((newContent: string) => {
    setCurrentContent(newContent);
  }, []);

  // Handle autosave
  const handleAutoSave = useCallback(() => {
    if (autoSave && onSave) {
      onSave();
      setLastSaved(new Date());
    }
  }, [autoSave, onSave]);

  // Manual save function
  const handleManualSave = () => {
    if (manualSave) {
      manualSave();
      setLastSaved(new Date());
    }
  };

  // Handle content change
  const handleContentChange = () => {
    onContentChange(currentContent);
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    
    const tagName = tagInput.trim();
    
    // Check if the tag already exists in linkedTags
    const tagExists = linkedTags.some((tag) => 
      typeof tag === 'string' 
        ? tag === tagName 
        : tag.name.toLowerCase() === tagName.toLowerCase()
    );
    
    if (!tagExists) {
      try {
        // First check if tag exists in available tags
        const existingTag = availableTags.find(
          tag => tag.name.toLowerCase() === tagName.toLowerCase()
        );
        
        if (existingTag) {
          // If tag exists, use it
          onTagsChange([...linkedTags, existingTag]);
        } else {
          // If tag doesn't exist, create a new one in the database
          const newTag = await createTag(tagName);
          if (newTag) {
            onTagsChange([...linkedTags, newTag]);
            // Refresh the tags list
            refetchTags();
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

  // Function to handle removing a tag
  const handleRemoveTag = (tagToRemove: string | Tag) => {
    const tagId = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.id;
    const updatedTags = linkedTags.filter(tag => 
      typeof tag === 'string' ? tag !== tagId : tag.id !== tagId
    );
    
    onTagsChange(updatedTags);
  };

  // Function to handle selecting an existing tag
  const handleSelectTag = (tag: Tag) => {
    const tagExists = linkedTags.some(t => 
      typeof t === 'string' ? t === tag.id : t.id === tag.id
    );
    
    if (!tagExists) {
      onTagsChange([...linkedTags, tag]);
    } else {
      toast.info("Tag already added to this note");
    }
    
    setTagInput("");
  };

  // Function to handle selecting a token
  const handleTokenSelect = (tokenId: string) => {
    // Find the token in the available tokens
    if (tokenId && availableTokens.length > 0) {
      const token = availableTokens.find(t => t.id === tokenId);
      if (token) {
        const tokenExists = linkedTokens.some(t => t.id === token.id);
        if (!tokenExists) {
          onTokensChange([...linkedTokens, token]);
        } else {
          toast.info("Token already linked to this note");
        }
      }
    }
  };

  const getAvailableTagsForSelection = () => {
    // Filter out tags that are already linked to this note
    return availableTags.filter(tag => 
      !linkedTags.some(linkedTag => 
        typeof linkedTag === 'string' 
          ? linkedTag === tag.id 
          : linkedTag.id === tag.id
      )
    );
  };

  // Check if the category is related to trading
  const isTradingCategory = category === "Trading" || category === "Pair Trading";

  // Handle title change
  const handleTitleChange = useCallback((newTitle: string) => {
    console.log("RichTextEditor received title change:", newTitle);
    onTitleChange(newTitle);
    
    // Trigger auto-save after title change
    if (autoSave && onSave) {
      setTimeout(() => {
        onSave();
        setLastSaved(new Date());
      }, 500);
    }
  }, [autoSave, onSave, onTitleChange]);

  return (
    <div className="flex flex-col gap-4 mt-2">
      <EditorHeader 
        title={title} 
        onTitleChange={handleTitleChange}
        category={category}
        onCategoryChange={onCategoryChange}
      />
      
      {/* Status and Save Button */}
      <EditorStatusBar 
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={handleManualSave}
      />
      
      {/* AI Resume and Trade Info Sections */}
      <SpecialSections 
        noteId={noteId}
        content={currentContent}
        initialSummary={summary}
        onSummaryGenerated={onSummaryGenerated}
        isTradingCategory={isTradingCategory}
        availableTokens={availableTokens}
        isLoadingTokens={isLoadingTokens}
        tradeInfo={tradeInfo}
        onTradeInfoChange={onTradeInfoChange}
      />
      
      {/* Tags and Tokens Section */}
      <MetadataSection 
        linkedTags={linkedTags}
        tagInput={tagInput}
        setTagInput={setTagInput}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
        handleSelectTag={handleSelectTag}
        isLoadingTags={isLoadingTags}
        getAvailableTagsForSelection={getAvailableTagsForSelection}
        linkedTokens={linkedTokens}
        handleRemoveToken={(tokenId) => {
          const updatedTokens = linkedTokens.filter(token => token.id !== tokenId);
          onTokensChange(updatedTokens);
        }}
        handleTokenSelect={handleTokenSelect}
        isLoadingTokens={isLoadingTokens}
      />
      
      {/* Editor with Tabs */}
      <Card className="p-0 border rounded-md overflow-hidden">
        <EditorTabs 
          content={content}
          onContentChange={handleContentChange}
          onContentUpdate={handleContentUpdate}
          onAutoSave={handleAutoSave}
          noteId={noteId}
          attachment_url={attachment_url}
          onAttachmentChange={onAttachmentChange}
          hasConclusion={hasConclusion}
        />
      </Card>
    </div>
  );
};

export default RichTextEditor;
