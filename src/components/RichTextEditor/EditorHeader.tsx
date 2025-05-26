
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
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
  onPrint?: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  category,
  onTitleChange,
  onCategoryChange,
  isPrintMode = false,
  onPrint
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

  // Enhanced title change handler with explicit immediate save
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    console.log("EditorHeader: Title changed to:", newTitle);
    
    if (onTitleChange) {
      console.log("EditorHeader: Calling onTitleChange with:", newTitle);
      onTitleChange(newTitle);
    } else {
      console.error("EditorHeader: onTitleChange callback is not defined");
    }
  };

  // FIXED: Enhanced category change handler with immediate save
  const handleCategoryChange = (value: string) => {
    console.log("EditorHeader: Category changed to:", value);
    
    // Immediately call the parent callback with the new category value
    if (onCategoryChange) {
      console.log("EditorHeader: Calling onCategoryChange with:", value);
      onCategoryChange(value);
    } else {
      console.error("EditorHeader: onCategoryChange callback is not defined");
    }
  };

  // Make sure we have a valid category value
  const safeCategory = category || "General";

  return (
    <div className="space-y-4">
      {isPrintMode ? (
        <h1 className="text-2xl font-bold">{title}</h1>
      ) : (
        <div className="flex justify-between items-center">
          <div className="flex-grow">
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
          {onPrint && (
            <div className="ml-4">
              <Button variant="outline" size="sm" onClick={onPrint} className="flex items-center gap-2">
                <Printer size={16} />
                Print
              </Button>
            </div>
          )}
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
