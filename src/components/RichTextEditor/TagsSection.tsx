import React, { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/types";
import { Loader, Plus, X, Tags, ChevronDown, Tag as TagIcon, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TagBadge from "@/components/ui/tag-badge";

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
  setCategoryFilter,
  availableCategories = []
}) => {
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const availableTags = getAvailableTagsForSelection();
  
  const filteredAvailableTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

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
            <DropdownMenuLabel>
              {categoryFilter 
                ? `Tags for ${categoryFilter}` 
                : "Select or Create Tag"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <div className="px-2 py-1">
              <div className="relative">
                <Search className="absolute left-2 top-1.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  placeholder="Search tags..."
                  className="pl-8 h-7 text-sm"
                />
              </div>
            </div>
            
            {filteredAvailableTags.length > 0 && (
              <>
                <div className="max-h-32 overflow-y-auto px-1 py-1">
                  {filteredAvailableTags.map((tag) => (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() => handleSelectTag(tag)}
                      className="cursor-pointer"
                    >
                      <span className="flex-1">{tag.name}</span>
                      {renderTagCategories(tag)}
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
              {categoryFilter && (
                <div className="mt-1 text-xs text-muted-foreground">
                  New tags will be linked to category: {categoryFilter}
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium flex items-center gap-1">
        <Tags size={16} className="text-[#1EAEDB]" />
        {categoryFilter 
          ? `Tags for ${categoryFilter}` 
          : "Tags"}
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
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
      
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-[150px] justify-between font-normal text-left"
              disabled={isLoadingTags || filteredAvailableTags.length === 0}
            >
              <span className="truncate">
                {isLoadingTags ? "Loading..." : (filteredAvailableTags.length === 0 ? "No tags" : "Select tag")}
              </span>
              <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            <div className="p-2">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  placeholder="Search tags..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[180px] overflow-auto">
              {filteredAvailableTags.map((tag) => (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => handleSelectTag(tag)}
                  className="cursor-pointer"
                >
                  <span className="flex-1">{tag.name}</span>
                  {renderTagCategories(tag)}
                </DropdownMenuItem>
              ))}
              {filteredAvailableTags.length === 0 && (
                <div className="text-center p-2 text-sm text-muted-foreground">
                  No matching tags found
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex items-center px-2 text-xs text-muted-foreground">OR</div>
        
        <div className="flex-1">
          <div className="flex gap-2">
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
          {categoryFilter && (
            <div className="mt-1 text-xs text-muted-foreground">
              New tags will be linked to category: {categoryFilter}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagsSection;
