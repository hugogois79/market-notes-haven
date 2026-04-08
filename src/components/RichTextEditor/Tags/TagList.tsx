
import React from "react";
import { X } from "lucide-react";
import { Tag } from "@/types";

interface TagListProps {
  linkedTags: Tag[];
  handleRemoveTag: (tagToRemove: string | Tag) => void;
  renderTagCategories: (tag: Tag) => React.ReactNode;
}

const TagList: React.FC<TagListProps> = ({
  linkedTags,
  handleRemoveTag,
  renderTagCategories,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {linkedTags.map((tag) => (
        <div
          key={tag.id}
          className="bg-[#0A3A5C] hover:bg-[#0A3A5C]/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
        >
          <span>{tag.name}</span>
          {renderTagCategories(tag)}
          <button
            onClick={() => handleRemoveTag(tag)}
            className="text-white/70 hover:text-white"
            aria-label={`Remove tag ${tag.name}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TagList;
