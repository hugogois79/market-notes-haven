
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TagsIcon, X, Plus } from "lucide-react";
import { Tag as TagType } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TagsSectionProps {
  linkedTags: TagType[];
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => Promise<void>;
  handleRemoveTag: (tagToRemove: TagType | string) => void;
  handleSelectTag: (tag: TagType) => void;
  availableTags: TagType[];
  isLoadingTags: boolean;
}

const TagsSection: React.FC<TagsSectionProps> = ({
  linkedTags,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag,
  handleSelectTag,
  availableTags,
  isLoadingTags
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <TagsIcon size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Tags</span>
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        {linkedTags.map(tag => (
          <Badge key={tag.id} variant="secondary" className="px-3 py-1 text-sm gap-2">
            {tag.name}
            <button onClick={() => handleRemoveTag(tag)} className="opacity-70 hover:opacity-100">
              <X size={12} />
            </button>
          </Badge>
        ))}
        
        <div className="flex gap-2">
          <div className="flex items-center gap-1 border rounded px-2 h-8 bg-background">
            <Input
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="border-0 h-7 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[80px] w-full text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full"
              onClick={handleAddTag}
            >
              <Plus size={14} />
            </Button>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 gap-1">
                <TagsIcon size={14} />
                <span className="text-xs">Browse</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="start">
              <div className="p-2 border-b">
                <p className="text-sm font-medium">Available Tags</p>
              </div>
              <div className="max-h-60 overflow-auto p-2">
                {isLoadingTags ? (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    Loading tags...
                  </div>
                ) : availableTags.length === 0 ? (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No additional tags available
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleSelectTag(tag)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default TagsSection;
