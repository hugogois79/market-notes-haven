
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tags as TagsIcon, X, Plus } from "lucide-react";
import { Tag as TagType } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TagsSectionProps {
  linkedTags: TagType[];
  tagInput: string;
  setTagInput: (input: string) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: TagType | string) => void;
  handleSelectTag: (tag: TagType) => void;
  isLoadingTags: boolean;
  getAvailableTagsForSelection: () => TagType[];
}

const TagsSection = ({
  linkedTags,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag,
  handleSelectTag,
  isLoadingTags,
  getAvailableTagsForSelection,
}: TagsSectionProps) => {
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
        
        <div className="flex items-center gap-2">
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
            className="h-8 w-28 text-sm"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddTag} 
            className="h-8"
          >
            Add
          </Button>
          
          {/* Tag Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <TagsIcon size={14} className="mr-1" />
                Choose Tags
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2">
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">Available Tags</div>
                
                {isLoadingTags ? (
                  <div className="text-sm text-muted-foreground py-2">Loading tags...</div>
                ) : getAvailableTagsForSelection().length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">No additional tags available</div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {getAvailableTagsForSelection().map(tag => (
                      <Badge 
                        key={tag.id} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-secondary transition-colors px-3 py-1 flex items-center gap-1"
                        onClick={() => handleSelectTag(tag)}
                      >
                        <Plus size={10} />
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
