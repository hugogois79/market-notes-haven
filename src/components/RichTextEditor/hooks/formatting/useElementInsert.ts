
import { RefObject, useCallback } from "react";
import { createSeparator } from "./formatters/separatorFormatters";

/**
 * Hook for inserting special elements like separators
 */
export const useElementInsert = (editorRef: RefObject<HTMLDivElement>) => {
  const insertVerticalSeparator = useCallback(() => {
    if (!editorRef.current) return;
    
    // Create a separator using the formatter function
    createSeparator(editorRef.current);
    
  }, [editorRef]);
  
  return { insertVerticalSeparator };
};
