
import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TagsSection from "./TagsSection";
import ProjectSection from "./ProjectSection";
import RelationsIndicator from "./RelationsIndicator";
import { Tag } from "@/types";

export interface EditorHeaderProps {
  title: string;
  category: string;
  onTitleChange: (title: string) => void;
  onCategoryChange: (category: string) => void;
  isPrintMode?: boolean;
  // Tags props
  linkedTags?: Tag[];
  tagInput?: string;
  setTagInput?: Dispatch<SetStateAction<string>>;
  handleAddTag?: () => Promise<void>;
  handleRemoveTag?: (tagToRemove: string | Tag) => void;
  handleSelectTag?: (tag: Tag) => void;
  isLoadingTags?: boolean;
  getAvailableTagsForSelection?: () => Tag[];
  // Project props
  selectedProjectId?: string | null;
  onProjectSelect?: (projectId: string | null) => void;
  // Relations props
  noteId?: string;
  onRelationsClick?: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  category,
  onTitleChange,
  onCategoryChange,
  isPrintMode = false,
  linkedTags = [],
  tagInput = "",
  setTagInput = () => {},
  handleAddTag = async () => {},
  handleRemoveTag = () => {},
  handleSelectTag = () => {},
  isLoadingTags = false,
  getAvailableTagsForSelection = () => [],
  selectedProjectId = null,
  onProjectSelect = () => {},
  noteId,
  onRelationsClick,
}) => {
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    "General",
    "Research",
    "Ideas",
    "Analysis",
    "Project",
    "Meeting",
    "Personal",
    "Legal",
  ]);

  // Fetch all unique categories from Supabase
  const { data: fetchedCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('category')
          .not('category', 'is', null);
        
        if (error) {
          console.error('Error fetching categories:', error);
          return [];
        }
        
        const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
        return categories;
      } catch (error) {
        console.error('Error in categories query:', error);
        return [];
      }
    },
  });

  useEffect(() => {
    if (fetchedCategories && fetchedCategories.length > 0) {
      const combinedCategories = [...new Set([
        ...availableCategories,
        ...fetchedCategories
      ])].sort();
      
      setAvailableCategories(combinedCategories);
    }
  }, [fetchedCategories]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    onTitleChange(newTitle);
  };

  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
  };

  const safeCategory = category || "General";

  return (
    <div className="space-y-3 pb-2">
      {isPrintMode ? (
        <h1 className="text-2xl font-bold">{title}</h1>
      ) : (
        <>
          {/* Title Row */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title || ""}
              onChange={handleTitleChange}
              placeholder="Note title"
              className="text-lg font-medium"
              autoFocus
            />
          </div>

          {/* Metadata Row - Category, Project, Tags, Relations */}
          <div className="flex flex-wrap items-start gap-3">
            {/* Category - compact */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="category" className="text-xs text-muted-foreground">
                Category
              </Label>
              <Select
                value={safeCategory}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category" className="w-[140px] h-8 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project - compact inline */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Projeto</Label>
              <ProjectSection 
                selectedProjectId={selectedProjectId}
                onProjectSelect={onProjectSelect}
                compact
              />
            </div>

            {/* Tags - compact inline */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground">Tags</Label>
              <TagsSection 
                linkedTags={linkedTags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                handleAddTag={handleAddTag}
                handleRemoveTag={handleRemoveTag}
                handleSelectTag={handleSelectTag}
                isLoadingTags={isLoadingTags}
                getAvailableTagsForSelection={getAvailableTagsForSelection}
                compact
                categoryFilter={category}
              />
            </div>

            {/* Relations indicator */}
            {noteId && (
              <div className="flex flex-col gap-1 justify-end">
                <Label className="text-xs text-muted-foreground invisible">R</Label>
                <RelationsIndicator 
                  noteId={noteId} 
                  onClick={onRelationsClick}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EditorHeader;

