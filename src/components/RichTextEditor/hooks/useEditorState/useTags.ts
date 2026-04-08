
import { useState, useCallback } from "react";
import { Tag } from "@/types";
import { toast } from "sonner";
import { createTag, fetchTags } from "@/services/tag";
import { useQuery } from "@tanstack/react-query";

export function useTags({
  initialTags,
  initialCategory,
  onTagsChange,
  availableTagsForSelection,
}: {
  initialTags: Tag[];
  initialCategory: string;
  onTagsChange: (tags: Tag[]) => void;
  availableTagsForSelection?: Tag[];
}) {
  const [tagInput, setTagInput] = useState("");
  
  const { data: fetchedTags = [], isLoading: isLoadingTags, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    enabled: !availableTagsForSelection,
  });

  // Check if tag exists in tags list (case insensitive)
  const checkTagExists = useCallback((tags: Tag[], tagName: string): boolean => {
    return tags.some((tag) => {
      // First check if tag is defined
      if (!tag) return false;
      
      if (typeof tag === 'string') {
        // For string tags, ensure both values are strings before comparing
        const tagValue = typeof tag === 'string' ? tag : '';
        const tagNameValue = typeof tagName === 'string' ? tagName : '';
        
        return tagValue.toLowerCase() === tagNameValue.toLowerCase();
      }
      
      // For Tag objects with proper type checking
      if (tag && typeof tag === 'object' && 'name' in tag) {
        const tagName1 = tag.name;
        const tagName2 = tagName;
        
        // Explicitly check if both values are strings before calling toLowerCase
        const tagNameLower = typeof tagName1 === 'string' && tagName1 ? tagName1.toLowerCase() : '';
        const inputTagNameLower = typeof tagName2 === 'string' && tagName2 ? tagName2.toLowerCase() : '';
        
        return tagNameLower === inputTagNameLower;
      }
      
      return false;
    });
  }, []);

  const handleAddTag = useCallback(async () => {
    if (!tagInput.trim()) return;
    
    const tagName = tagInput.trim();
    
    // Check if tag with this name already exists in initialTags (case insensitive)
    const tagExists = checkTagExists(initialTags, tagName);
    
    if (!tagExists) {
      try {
        const tagsToSearch = availableTagsForSelection || fetchedTags;
        
        // Check if tag exists in available tags (case insensitive)
        const existingTag = tagsToSearch.find(tag => {
          // First check if tag is defined
          if (!tag) return false;
          
          // Then check if it has a name property that's a string
          if (tag && typeof tag === 'object' && 'name' in tag) {
            const tagName1 = tag.name;
            const tagName2 = tagName;
            
            // Explicitly check if both values are strings before calling toLowerCase
            const tagNameLower = typeof tagName1 === 'string' && tagName1 ? tagName1.toLowerCase() : '';
            const inputTagNameLower = typeof tagName2 === 'string' && tagName2 ? tagName2.toLowerCase() : '';
            
            return tagNameLower === inputTagNameLower;
          }
          
          return false;
        });
        
        if (existingTag) {
          onTagsChange([...initialTags, existingTag]);
        } else {
          const newTag = await createTag(tagName, initialCategory);
          if (newTag) {
            onTagsChange([...initialTags, newTag]);
            refetchTags();
            toast.success(`Created tag "${tagName}" in category "${initialCategory}"`);
          } else {
            toast.error("Failed to create tag");
          }
        }
      } catch (error) {
        console.error("Error adding tag:", error);
        toast.error("Failed to add tag");
      }
    } else {
      toast.info("Tag already added to this note");
    }
    
    setTagInput("");
  }, [tagInput, initialTags, initialCategory, onTagsChange, availableTagsForSelection, fetchedTags, refetchTags, checkTagExists]);

  const handleRemoveTag = useCallback((tagToRemove: string | Tag) => {
    const tagId = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.id;
    const updatedTags = initialTags.filter(tag => 
      typeof tag === 'string' ? tag !== tagId : tag.id !== tagId
    );
    
    onTagsChange(updatedTags);
  }, [initialTags, onTagsChange]);

  const handleSelectTag = useCallback((tag: Tag) => {
    // Check if tag already exists in initialTags by comparing id (more reliable than name)
    const tagExists = initialTags.some(t => 
      typeof t === 'string' ? t === tag.id : t.id === tag.id
    );
    
    if (!tagExists) {
      onTagsChange([...initialTags, tag]);
    } else {
      toast.info("Tag already added to this note");
    }
    
    setTagInput("");
  }, [initialTags, onTagsChange]);

  const getAvailableTagsForSelection = useCallback(() => {
    const tagsToFilter = availableTagsForSelection || fetchedTags;
    if (!tagsToFilter || !Array.isArray(tagsToFilter)) {
      return [];
    }
    
    return tagsToFilter.filter(tag => 
      tag && initialTags.some(linkedTag => 
        typeof linkedTag === 'string' 
          ? linkedTag === tag.id 
          : linkedTag.id === tag.id
      ) === false
    );
  }, [availableTagsForSelection, fetchedTags, initialTags]);

  return {
    tagInput,
    setTagInput,
    handleAddTag,
    handleRemoveTag,
    handleSelectTag,
    getAvailableTagsForSelection,
    isLoadingTags,
    fetchedTags
  };
}
