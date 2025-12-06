
import React from "react";
import { Card } from "@/components/ui/card";
import TagsSection from "./TagsSection";
import ProjectSection from "./ProjectSection";
import { Tag } from "@/types";

interface MetadataSectionProps {
  linkedTags: Tag[];
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => Promise<void>;
  handleRemoveTag: (tagToRemove: string | Tag) => void;
  handleSelectTag: (tag: Tag) => void;
  isLoadingTags: boolean;
  getAvailableTagsForSelection: () => Tag[];
  selectedProjectId?: string | null;
  onProjectSelect?: (projectId: string | null) => void;
  compact?: boolean;
  categoryFilter?: string;
  category?: string;
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
  selectedProjectId = null,
  onProjectSelect = () => {},
  compact = false,
  categoryFilter,
  category
}: MetadataSectionProps) => {
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
          categoryFilter={categoryFilter || category}
        />
      </div>
      
      <div className="flex-1">
        <ProjectSection 
          selectedProjectId={selectedProjectId}
          onProjectSelect={onProjectSelect}
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
          categoryFilter={categoryFilter || category}
        />
      </Card>
      
      <Card className="p-4 border rounded-md flex-1">
        <ProjectSection 
          selectedProjectId={selectedProjectId}
          onProjectSelect={onProjectSelect}
          compact={compact}
        />
      </Card>
    </div>
  );
};

export default MetadataSection;
