
import { useState, useEffect } from "react";
import { Note, Tag, Token } from "@/types";

export const useTagsAndTokens = (currentNote: Note) => {
  const [linkedTags, setLinkedTags] = useState<Tag[]>([]);
  const [linkedTokens, setLinkedTokens] = useState<Token[]>([]);
  
  // Initialize with current note's tags and tokens
  useEffect(() => {
    if (currentNote.tags) {
      // Process tags in steps to ensure type safety
      // Step 1: Filter out null/undefined values with a proper type predicate
      const nonNullTags = currentNote.tags.filter((tag): tag is NonNullable<typeof tag> => 
        tag !== null && tag !== undefined
      );
      
      // Step 2: Map to Tag objects with proper null safety
      const tagObjects = nonNullTags.map(tag => {
        // Handle Tag objects
        if (typeof tag === 'object' && tag !== null && 'id' in tag) {
          return tag as Tag;
        }
        
        // For string or other primitive types, create a Tag object
        const safeTagValue = String(tag);
        
        return { 
          id: safeTagValue, 
          name: safeTagValue 
        };
      });
      
      setLinkedTags(tagObjects);
    }
    
    if (currentNote.tokens) {
      setLinkedTokens(currentNote.tokens);
    }
  }, [currentNote]);

  const handleTagsChange = (tags: Tag[]) => {
    console.log("Tags changed:", tags);
    setLinkedTags(tags);
    
    // Extract tag IDs for the note object
    const tagIds = tags.map(tag => tag.id);
    return { tags: tagIds };
  };

  const handleTokensChange = (tokens: Token[]) => {
    console.log("Tokens changed:", tokens);
    setLinkedTokens(tokens);
    
    return { tokens };
  };

  return {
    linkedTags,
    linkedTokens,
    handleTagsChange,
    handleTokensChange
  };
};
