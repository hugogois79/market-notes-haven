
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
  selectedFilterTokens
}: MetadataSectionProps) => {
  return (
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
        />
      </Card>
    </div>
  );
};

export default MetadataSection;
