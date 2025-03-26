
import { useState } from "react";
import { Tag as TagIcon, Edit, Trash2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag } from "@/types";

interface TagWithCount extends Tag {
  count: number;
  isSelected?: boolean;
}

interface TagsListProps {
  tags: TagWithCount[];
  selectedTag: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  categories: string[];
  bulkSelectedTags: string[];
  onTagClick: (tagId: string) => void;
  onTagDelete: (tagId: string) => void;
  onTagSelection: (tagId: string) => void;
  onSelectAllTags: () => void;
  onUpdateTagCategory: (tagId: string, category: string | null) => void;
  onNewCategoryDialog: (show: boolean) => void;
}

const TagsList = ({
  tags,
  selectedTag,
  selectedCategory,
  searchQuery,
  categories,
  bulkSelectedTags,
  onTagClick,
  onTagDelete,
  onTagSelection,
  onSelectAllTags,
  onUpdateTagCategory,
  onNewCategoryDialog
}: TagsListProps) => {
  const [isEditingTag, setIsEditingTag] = useState<string | null>(null);
  const [editTagCategory, setEditTagCategory] = useState<string | null>(null);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);

  const getFilteredTags = () => {
    return tags.filter(tag => 
      (!selectedCategory || tag.category === selectedCategory) &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleUpdateTagCategory = async (tagId: string) => {
    setIsUpdatingTag(true);
    
    try {
      await onUpdateTagCategory(tagId, editTagCategory);
    } finally {
      setIsUpdatingTag(false);
      setIsEditingTag(null);
      setEditTagCategory(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TagIcon size={20} className="text-[#1EAEDB]" />
          {selectedCategory ? `Tags in "${selectedCategory}"` : "All Tags"}
        </h2>
        
        {getFilteredTags().length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAllTags}
              className="gap-1"
            >
              <Checkbox 
                checked={getFilteredTags().length > 0 && 
                  getFilteredTags().every(tag => bulkSelectedTags.includes(tag.id))} 
                className="mr-1"
              />
              Select all
            </Button>
          </div>
        )}
      </div>
      
      {getFilteredTags().length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {getFilteredTags().map((tag) => (
            <div key={tag.id} className="flex items-center">
              <div className="flex items-center mr-1">
                <Checkbox
                  id={`select-${tag.id}`}
                  checked={bulkSelectedTags.includes(tag.id)}
                  onCheckedChange={() => onTagSelection(tag.id)}
                  className="mr-1 data-[state=checked]:bg-[#1EAEDB] data-[state=checked]:text-white"
                />
              </div>
              <Badge 
                variant={selectedTag === tag.id ? "default" : "secondary"}
                className={`text-sm py-1 px-3 cursor-pointer hover:bg-opacity-90 transition-all ${
                  selectedTag === tag.id ? 'bg-[#1EAEDB]' : bulkSelectedTags.includes(tag.id) ? 'border-[#1EAEDB] border' : ''
                }`}
                onClick={() => onTagClick(tag.id)}
              >
                {tag.name}
                <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs">
                  {tag.count}
                </span>
                {tag.category && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({tag.category})
                  </span>
                )}
              </Badge>
              
              {isEditingTag === tag.id ? (
                <div className="flex items-center ml-1">
                  <Select
                    value={editTagCategory || ""}
                    onValueChange={(value) => {
                      if (value === "new") {
                        onNewCategoryDialog(true);
                      } else {
                        setEditTagCategory(value === "" ? null : value);
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 w-[120px]">
                      <SelectValue placeholder="Category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No category</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                      <SelectItem value="new" className="text-[#1EAEDB] font-medium">+ Create new</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={() => handleUpdateTagCategory(tag.id)}
                    disabled={isUpdatingTag}
                  >
                    <Check size={14} className="text-green-500" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setIsEditingTag(null);
                      setEditTagCategory(null);
                    }}
                  >
                    <X size={14} className="text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <div className="flex">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 ml-1"
                    onClick={() => {
                      setIsEditingTag(tag.id);
                      setEditTagCategory(tag.category);
                    }}
                  >
                    <Edit size={14} className="text-muted-foreground hover:text-primary" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={() => onTagDelete(tag.id)}
                  >
                    <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <TagIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchQuery ? "No tags found matching your search." : "No tags found. Add tags to your notes to see them here."}
          </p>
        </div>
      )}
    </div>
  );
};

export default TagsList;
