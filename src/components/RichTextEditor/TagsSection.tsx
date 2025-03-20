
import React, { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/types";
import { Loader, Plus, X, Tags, ChevronDown, Tag as TagIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  compact = false
}) => {
  const availableTags = getAvailableTagsForSelection();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-2 mr-2">
          {linkedTags.map((tag) => (
            <div
              key={tag.id}
              className="bg-[#0A3A5C] hover:bg-[#0A3A5C]/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
            >
              <span>{tag.name}</span>
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 gap-1 font-normal"
            >
              <TagIcon size={14} />
              <span className="hidden sm:inline">Add Tags</span>
              <ChevronDown size={14} className="opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel>Select or Create Tag</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {availableTags.length > 0 && (
              <>
                <div className="max-h-32 overflow-y-auto px-1 py-1">
                  {availableTags.map((tag) => (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() => handleSelectTag(tag)}
                      className="cursor-pointer"
                    >
                      {tag.name}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            
            <div className="p-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Create new tag..."
                  className="flex-1 h-8 text-sm"
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
                  className="h-8 w-8"
                  onClick={() => handleAddTag()}
                  disabled={!tagInput.trim() || isLoadingTags}
                >
                  {isLoadingTags ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Original non-compact layout
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium flex items-center gap-1">
        <Tags size={16} className="text-[#1EAEDB]" />
        Tags
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {linkedTags.map((tag) => (
          <div
            key={tag.id}
            className="bg-[#0A3A5C] hover:bg-[#0A3A5C]/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
          >
            <span>{tag.name}</span>
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
      
      <div className="flex gap-2">
        {/* Tag dropdown selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-[150px] justify-between font-normal text-left"
              disabled={isLoadingTags || availableTags.length === 0}
            >
              <span className="truncate">
                {isLoadingTags ? "Loading..." : (availableTags.length === 0 ? "No tags" : "Select tag")}
              </span>
              <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[150px] max-h-[180px] overflow-auto">
            {availableTags.map((tag) => (
              <DropdownMenuItem
                key={tag.id}
                onClick={() => handleSelectTag(tag)}
                className="cursor-pointer"
              >
                {tag.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Divider for "Or" text */}
        <div className="flex items-center px-2 text-xs text-muted-foreground">OR</div>
        
        {/* Add new tag input */}
        <div className="flex gap-2 flex-1">
          <Input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Create new tag..."
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
      </div>
    </div>
  );
};

export default TagsSection;
