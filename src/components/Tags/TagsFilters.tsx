
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag } from "@/types";

interface TagsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag: string | null;
  onClearSelection: () => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
  tags: Tag[];
  onNewCategoryDialog: (show: boolean) => void;
}

const TagsFilters = ({
  searchQuery,
  onSearchChange,
  selectedTag,
  onClearSelection,
  selectedCategory,
  onCategoryChange,
  categories,
  tags,
  onNewCategoryDialog
}: TagsFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in tags or notes..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <Select
          value={selectedCategory || "all"}
          onValueChange={(value) => {
            if (value === "new") {
              onNewCategoryDialog(true);
            } else {
              onCategoryChange(value === "all" ? null : value);
            }
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
            <SelectItem value="new" className="text-[#1EAEDB] font-medium">+ Create new category</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {selectedTag && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center mr-2">
            <span className="text-sm text-muted-foreground">Filtered by tag:</span>
            <Badge variant="default" className="cursor-pointer bg-[#1EAEDB] ml-2">
              {tags.find(t => t.id === selectedTag)?.name || "Unknown"}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-8 w-8 p-0" 
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear filter</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagsFilters;
