
import React, { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/types";
import { Loader, Plus, X } from "lucide-react";

export interface TagsSectionProps {
  linkedTags: Tag[];
  tagInput: string;
  setTagInput: Dispatch<SetStateAction<string>>;
  handleAddTag: () => Promise<void>;
  handleRemoveTag: (tagToRemove: string | Tag) => void;
  handleSelectTag: (tag: Tag) => void;
  isLoadingTags: boolean;
  getAvailableTagsForSelection: () => Tag[];
}

const TagsSection: React.FC<TagsSectionProps> = ({
  linkedTags,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag,
  handleSelectTag,
  isLoadingTags,
  getAvailableTagsForSelection
}) => {
  const availableTags = getAvailableTagsForSelection();

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Tags</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {linkedTags.map((tag) => (
          <div
            key={typeof tag === "string" ? tag : tag.id}
            className="bg-[#0A3A5C] hover:bg-[#0A3A5C]/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
          >
            <span>{typeof tag === "string" ? tag : tag.name}</span>
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-white/70 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Add tags..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && tagInput.trim()) {
              e.preventDefault();
              handleAddTag();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => handleAddTag()}
          disabled={!tagInput.trim() || isLoadingTags}
        >
          {isLoadingTags ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
        </Button>
      </div>
      {availableTags.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-muted-foreground mb-1">Suggested tags:</div>
          <div className="flex flex-wrap gap-1">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleSelectTag(tag)}
                className="text-xs px-2 py-0.5 rounded-full bg-[#0A3A5C]/90 text-white hover:bg-[#0A3A5C]"
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagsSection;
