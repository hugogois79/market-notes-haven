
import { useState, useEffect } from "react";
import { Note, Tag, Token } from "@/types";

export const useTagsAndTokens = (currentNote: Note) => {
  const [linkedTags, setLinkedTags] = useState<Tag[]>([]);
  const [linkedTokens, setLinkedTokens] = useState<Token[]>([]);
  
  // Initialize with current note's tags and tokens
  useEffect(() => {
    if (currentNote.tags) {
      // Filter out null/undefined tags first, then map to Tag objects
      const tagObjects = currentNote.tags
        .filter((tag): tag is NonNullable<typeof tag> => tag !== null && tag !== undefined)
        .map(tag => {
          // If it's already a Tag object, return it
          if (typeof tag === 'object' && tag !== null && 'id' in tag) {
            return tag as Tag;
          }
          
          // Now TypeScript knows tag can't be null or undefined
          const tagString = String(tag);
          return { 
            id: tagString, 
            name: tagString 
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
