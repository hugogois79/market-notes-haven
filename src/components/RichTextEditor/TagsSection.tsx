
import React, { Dispatch, SetStateAction } from "react";
import { Tags } from "lucide-react";
import { Tag } from "@/types";
import TagList from "./Tags/TagList";
import CompactTagInput from "./Tags/CompactTagInput";
import FullTagInput from "./Tags/FullTagInput";

export interface TagsSectionProps {
  linkedTags: Tag[];
  tagInput: string;
  setTagInput: Dispatch<SetStateAction<string>>;
  handleAddTag: () => Promise<void>;
  handleRemoveTag: (tagToRemove: string | Tag) => void;
  handleSelectTag: (tag: Tag) => void;
  isLoadingTags: boolean;
  getAvailableTagsForSelection: () => Tag[];
  compact?: boolean;
  categoryFilter?: string | null;
  setCategoryFilter?: Dispatch<SetStateAction<string | null>>;
  availableCategories?: string[];
}

const TagsSection: React.FC<TagsSectionProps> = ({
  linkedTags,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag,
  handleSelectTag,
  isLoadingTags,
  getAvailableTagsForSelection,
  compact = false,
  categoryFilter,
}) => {
  const availableTags = getAvailableTagsForSelection();

  const renderTagCategories = (tag: Tag) => {
    if (!tag.categories || tag.categories.length === 0) {
      return tag.category ? (
        <span className="text-xs text-muted-foreground ml-1">({tag.category})</span>
      ) : null;
    }
    
    return (
      <span className="text-xs text-muted-foreground ml-1">
        ({tag.categories.join(', ')})
      </span>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-2 mr-2">
          <TagList 
            linkedTags={linkedTags}
            handleRemoveTag={handleRemoveTag}
            renderTagCategories={renderTagCategories}
          />
        </div>
        
        <CompactTagInput
          tagInput={tagInput}
          setTagInput={setTagInput}
          handleAddTag={handleAddTag}
          handleSelectTag={handleSelectTag}
          isLoadingTags={isLoadingTags}
          filteredAvailableTags={availableTags}
          renderTagCategories={renderTagCategories}
          categoryFilter={categoryFilter || undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium flex items-center gap-1">
        <Tags size={16} className="text-[#1EAEDB]" />
        {categoryFilter ? `Tags for ${categoryFilter}` : "Tags"}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <TagList 
          linkedTags={linkedTags}
          handleRemoveTag={handleRemoveTag}
          renderTagCategories={renderTagCategories}
        />
      </div>
      
      <FullTagInput
        tagInput={tagInput}
        setTagInput={setTagInput}
        handleAddTag={handleAddTag}
        handleSelectTag={handleSelectTag}
        isLoadingTags={isLoadingTags}
        filteredAvailableTags={availableTags}
        renderTagCategories={renderTagCategories}
        categoryFilter={categoryFilter || undefined}
      />
    </div>
  );
};

export default TagsSection;
