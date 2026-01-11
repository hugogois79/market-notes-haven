
import React from "react";
import { Tag, TagIcon, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tag as TagType } from "@/types";

interface CompactTagInputProps {
  tagInput: string;
  setTagInput: (value: string) => void;
  handleAddTag: () => Promise<void>;
  handleSelectTag: (tag: TagType) => void;
  isLoadingTags: boolean;
  filteredAvailableTags: TagType[];
  renderTagCategories: (tag: TagType) => React.ReactNode;
  categoryFilter?: string;
}

const CompactTagInput: React.FC<CompactTagInputProps> = ({
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 font-normal">
          <TagIcon size={14} />
          <span className="hidden sm:inline">Add Tags</span>
          <ChevronDown size={14} className="opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 z-50 bg-popover text-popover-foreground border shadow-md">
        <DropdownMenuLabel>
          {categoryFilter ? `Tags for ${categoryFilter}` : "Select or Create Tag"}
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
        
        {isLoadingTags ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            A carregar tags...
          </div>
        ) : searchFilteredTags.length > 0 ? (
          <>
            <div className="max-h-48 overflow-y-auto px-1 py-1">
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
            </div>
            <DropdownMenuSeparator />
          </>
        ) : filteredAvailableTags.length === 0 && !tagSearchQuery ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            Nenhuma tag disponível
          </div>
        ) : null}
        {tagSearchQuery && searchFilteredTags.length === 0 && filteredAvailableTags.length > 0 && (
          <div className="px-2 py-2 text-sm text-muted-foreground text-center">
            No tags found for "{tagSearchQuery}"
          </div>
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
              {isLoadingTags ? <Search size={14} className="animate-spin" /> : <Tag size={14} />}
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
  );
};

export default CompactTagInput;
