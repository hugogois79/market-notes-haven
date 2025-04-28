
import { useState, useEffect } from "react";
import { Note, Tag, Token } from "@/types";

export const useTagsAndTokens = (currentNote: Note) => {
  const [linkedTags, setLinkedTags] = useState<Tag[]>([]);
  const [linkedTokens, setLinkedTokens] = useState<Token[]>([]);
  
  // Initialize with current note's tags and tokens
  useEffect(() => {
    if (currentNote.tags) {
      // Process tags in steps to ensure type safety
      // Step 1: Filter out null/undefined values without changing the type
      const nonNullTags = currentNote.tags.filter((tag): tag is NonNullable<typeof tag> => 
        tag !== null && tag !== undefined
      );
      
      // Step 2: Map to Tag objects
      const tagObjects = nonNullTags.map(tag => {
        // If it's already a Tag object, return it
        if (typeof tag === 'object' && tag !== null && 'id' in tag) {
          return tag as Tag;
        }
        
        // At this point tag must be a string
        return { 
          id: tag, 
          name: tag 
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
