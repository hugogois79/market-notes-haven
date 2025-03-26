
import React, { useEffect, useState } from "react";
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

export interface EditorHeaderProps {
  title: string;
  category: string;
  onTitleChange: (title: string) => void;
  onCategoryChange: (category: string) => void;
  isPrintMode?: boolean;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  category,
  onTitleChange,
  onCategoryChange,
  isPrintMode = false,
}) => {
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    "General",
    "Research",
    "Ideas",
    "Analysis",
    "Project",
    "Meeting",
    "Personal",
  ]);

  // Fetch all unique categories from Supabase
  const { data: fetchedCategories, isLoading } = useQuery({
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
        
        // Extract unique categories
        const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
        return categories;
      } catch (error) {
        console.error('Error in categories query:', error);
        return [];
      }
    },
  });

  // Update available categories when fetched data changes
  useEffect(() => {
    if (fetchedCategories && fetchedCategories.length > 0) {
      // Combine default categories with fetched ones and remove duplicates
      const combinedCategories = [...new Set([
        ...availableCategories,
        ...fetchedCategories
      ])].sort();
      
      setAvailableCategories(combinedCategories);
    }
  }, [fetchedCategories]);

  // Create a separate handler for title changes to ensure events are processed correctly
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("EditorHeader: Title changed to:", e.target.value);
    // Ensure the value is passed directly to the parent component
    onTitleChange(e.target.value);
  };

  // Handle category changes
  const handleCategoryChange = (value: string) => {
    console.log("EditorHeader: Category changed to:", value);
    onCategoryChange(value);
  };

  // Debugging - log current values
  useEffect(() => {
    console.log("EditorHeader: Current title value:", title);
    console.log("EditorHeader: Current category value:", category);
  }, [title, category]);

  // Make sure we have a valid category value
  const safeCategory = category || "General";

  return (
    <div className="space-y-4">
      {isPrintMode ? (
        <h1 className="text-2xl font-bold">{title}</h1>
      ) : (
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
      )}

      {!isPrintMode && (
        <div>
          <Label htmlFor="category" className="text-sm font-medium">
            Category
          </Label>
          <Select
            value={safeCategory}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id="category" className="w-full md:w-60">
              <SelectValue placeholder="Select category" />
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
      )}
    </div>
  );
};

export default EditorHeader;
