
import { RefObject, useCallback } from "react";

/**
 * Hook for inserting special elements like separators
 */
export const useElementInsert = (editorRef: RefObject<HTMLDivElement>) => {
  const insertVerticalSeparator = useCallback(() => {
    if (!editorRef.current) return;
    
    // Focus on the editor first
    editorRef.current.focus();
    
    // Create a horizontal separator with just a line (no section symbol)
    const separatorHTML = `
      <div class="chapter-separator" style="
        width: 100%;
        margin: 1.5rem 0;
        text-align: center;
        position: relative;
        overflow: hidden;
        height: 20px;
      ">
        <hr style="
          margin: 0;
          border: none;
          border-top: 1px solid #d1d5db;
        "/>
      </div>
    `;
    
    // Insert the separator HTML
    document.execCommand('insertHTML', false, separatorHTML);
    
    // Trigger an input event to ensure changes are registered
    if (editorRef.current) {
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  }, [editorRef]);
  
  return { insertVerticalSeparator };
};
