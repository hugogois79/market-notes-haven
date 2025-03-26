import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Tag, Token, Note, TradeInfo } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchTags, createTag } from "@/services/tag";
import { fetchTokens } from "@/services/tokenService";
import { toast } from "sonner";

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
  availableTagsForSelection?: Tag[];
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
  availableTagsForSelection,
}: RichTextEditorProps) => {
  
  const [tagInput, setTagInput] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentContent, setCurrentContent] = useState(content);
  
  const { data: fetchedTags = [], isLoading: isLoadingTags, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    enabled: !availableTagsForSelection,
  });

  const { data: availableTokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
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
    if (manualSave) {
      manualSave();
      setLastSaved(new Date());
    }
  };

  const handleContentChange = () => {
    onContentChange(currentContent);
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    
    const tagName = tagInput.trim();
    
    const tagExists = linkedTags.some((tag) => 
      typeof tag === 'string' 
        ? tag === tagName 
        : tag.name.toLowerCase() === tagName.toLowerCase()
    );
    
    if (!tagExists) {
      try {
        const tagsToSearch = availableTagsForSelection || fetchedTags;
        
        const existingTag = tagsToSearch.find(
          tag => tag && tag.name && tag.name.toLowerCase() === tagName.toLowerCase()
        );
        
        if (existingTag) {
          onTagsChange([...linkedTags, existingTag]);
        } else {
          const newTag = await createTag(tagName, category);
          if (newTag) {
            onTagsChange([...linkedTags, newTag]);
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

  const handleRemoveTag = (tagToRemove: string | Tag) => {
    const tagId = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.id;
    const updatedTags = linkedTags.filter(tag => 
      typeof tag === 'string' ? tag !== tagId : tag.id !== tagId
    );
    
    onTagsChange(updatedTags);
  };

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

  const handleTokenSelect = (tokenOrId: Token | string) => {
    console.log("RichTextEditor: handleTokenSelect received:", tokenOrId);
    
    if (typeof tokenOrId === 'string') {
      const tokenId = tokenOrId;
      
      const token = availableTokens.find(t => t.id === tokenId);
      if (token) {
        console.log("RichTextEditor: Found token by ID:", token);
        const tokenExists = linkedTokens.some(t => t.id === token.id);
        if (!tokenExists) {
          const updatedTokens = [...linkedTokens, token];
          console.log("RichTextEditor: Updating tokens to:", updatedTokens);
          onTokensChange(updatedTokens);
        } else {
          toast.info("Token already linked to this note");
        }
      } else {
        console.error("RichTextEditor: Token not found with ID:", tokenId);
      }
    } else {
      const token = tokenOrId;
      const tokenExists = linkedTokens.some(t => t.id === token.id);
      if (!tokenExists) {
        const updatedTokens = [...linkedTokens, token];
        console.log("RichTextEditor: Updating tokens to:", updatedTokens);
        onTokensChange(updatedTokens);
      } else {
        toast.info("Token already linked to this note");
      }
    }
  };

  const getAvailableTagsForSelection = () => {
    const tagsToFilter = availableTagsForSelection || fetchedTags;
    if (!tagsToFilter || !Array.isArray(tagsToFilter)) {
      return [];
    }
    
    return tagsToFilter.filter(tag => 
      tag && linkedTags.some(linkedTag => 
        typeof linkedTag === 'string' 
          ? linkedTag === tag.id 
          : linkedTag.id === tag.id
      ) === false
    );
  };

  const isTradingCategory = category === "Trading" || category === "Pair Trading";

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

  return (
    <div className="flex flex-col gap-4 mt-2">
      <EditorHeader 
        title={title} 
        onTitleChange={handleTitleChange}
        category={category}
        onCategoryChange={onCategoryChange}
      />
      
      <EditorStatusBar 
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={handleManualSave}
      />
      
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
          console.log("Removing token, updated tokens:", updatedTokens);
          onTokensChange(updatedTokens);
        }}
        handleTokenSelect={handleTokenSelect}
        isLoadingTokens={isLoadingTokens}
        category={category}
      />
      
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
          category={category}
        />
      </Card>
    </div>
  );
};

export default RichTextEditor;
