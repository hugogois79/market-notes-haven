
import React from "react";
import { Card } from "@/components/ui/card";
import TagsSection from "./TagsSection";
import TokenSection from "./TokenSection";
import { Tag, Token } from "@/types";

interface MetadataSectionProps {
  linkedTags: Tag[];
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => Promise<void>;
  handleRemoveTag: (tagToRemove: string | Tag) => void;
  handleSelectTag: (tag: Tag) => void;
  isLoadingTags: boolean;
  getAvailableTagsForSelection: () => Tag[];
  linkedTokens: Token[];
  handleRemoveToken: (tokenId: string) => void;
  handleTokenSelect: (tokenId: string) => void;
  isLoadingTokens: boolean;
  isFilter?: boolean;
  onFilterChange?: (tokenId: string | null) => void;
  selectedFilterToken?: string | null;
  onMultiFilterChange?: (tokenId: string) => void;
  selectedFilterTokens?: string[];
  compact?: boolean; // Added prop for compact layout
}

const MetadataSection = ({
  linkedTags,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag,
  handleSelectTag,
  isLoadingTags,
  getAvailableTagsForSelection,
  linkedTokens,
  handleRemoveToken,
  handleTokenSelect,
  isLoadingTokens,
  isFilter = false,
  onFilterChange,
  selectedFilterToken,
  onMultiFilterChange,
  selectedFilterTokens,
  compact = false // Default to false for backward compatibility
}: MetadataSectionProps) => {
  // Use different layout based on compact prop
  return compact ? (
    <div className="flex gap-4">
      <div className="flex-1">
        <TagsSection 
          linkedTags={linkedTags}
          tagInput={tagInput}
          setTagInput={setTagInput}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          handleSelectTag={handleSelectTag}
          isLoadingTags={isLoadingTags}
          getAvailableTagsForSelection={getAvailableTagsForSelection}
          compact={compact}
        />
      </div>
      
      <div className="flex-1">
        <TokenSection 
          selectedTokens={linkedTokens} 
          handleRemoveToken={handleRemoveToken}
          handleTokenSelect={handleTokenSelect}
          isLoadingTokens={isLoadingTokens}
          isFilter={isFilter}
          onFilterChange={onFilterChange}
          selectedFilterToken={selectedFilterToken}
          onMultiFilterChange={onMultiFilterChange}
          selectedFilterTokens={selectedFilterTokens}
          compact={compact}
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col md:flex-row gap-4">
      <Card className="p-4 border rounded-md flex-1">
        <TagsSection 
          linkedTags={linkedTags}
          tagInput={tagInput}
          setTagInput={setTagInput}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          handleSelectTag={handleSelectTag}
          isLoadingTags={isLoadingTags}
          getAvailableTagsForSelection={getAvailableTagsForSelection}
          compact={compact}
        />
      </Card>
      
      <Card className="p-4 border rounded-md flex-1">
        <TokenSection 
          selectedTokens={linkedTokens} 
          handleRemoveToken={handleRemoveToken}
          handleTokenSelect={handleTokenSelect}
          isLoadingTokens={isLoadingTokens}
          isFilter={isFilter}
          onFilterChange={onFilterChange}
          selectedFilterToken={selectedFilterToken}
          onMultiFilterChange={onMultiFilterChange}
          selectedFilterTokens={selectedFilterTokens}
          compact={compact}
        />
      </Card>
    </div>
  );
};

export default MetadataSection;
