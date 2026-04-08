
import React from "react";
import { Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tag as TagType } from "@/types";

interface FullTagInputProps {
  tagInput: string;
  setTagInput: (value: string) => void;
  handleAddTag: () => Promise<void>;
  handleSelectTag: (tag: TagType) => void;
  isLoadingTags: boolean;
  filteredAvailableTags: TagType[];
  renderTagCategories: (tag: TagType) => React.ReactNode;
  categoryFilter?: string;
}

const FullTagInput: React.FC<FullTagInputProps> = ({
  tagInput,
  setTagInput,
  handleAddTag,
  handleSelectTag,
  isLoadingTags,
  filteredAvailableTags,
  renderTagCategories,
  categoryFilter,
}) => {
  const [tagSearchQuery, setTagSearchQuery] = React.useState("");

  // Filter tags based on search query
  const searchFilteredTags = React.useMemo(() => {
    if (!tagSearchQuery.trim()) {
      return filteredAvailableTags;
    }
    const query = tagSearchQuery.toLowerCase();
    return filteredAvailableTags.filter(tag => 
      tag.name.toLowerCase().includes(query)
    );
  }, [filteredAvailableTags, tagSearchQuery]);

  return (
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
            <Tag className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px] z-[100] bg-popover text-popover-foreground border shadow-lg">
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
          <div className="max-h-[180px] overflow-auto">
            {searchFilteredTags.map((tag) => (
              <DropdownMenuItem
                key={tag.id}
                onClick={() => handleSelectTag(tag)}
                className="cursor-pointer"
              >
                <span className="flex-1">{tag.name}</span>
                {renderTagCategories(tag)}
              </DropdownMenuItem>
            ))}
            {searchFilteredTags.length === 0 && (
              <div className="text-center p-2 text-sm text-muted-foreground">
                {tagSearchQuery ? `No tags found for "${tagSearchQuery}"` : "No matching tags found"}
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
            {isLoadingTags ? <Search size={16} className="animate-spin" /> : <Tag size={16} />}
          </Button>
        </div>
        {categoryFilter && (
          <div className="mt-1 text-xs text-muted-foreground">
            New tags will be linked to category: {categoryFilter}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullTagInput;
