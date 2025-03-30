import React, { useEffect, useRef } from "react";
import ContentStyles from "./ContentStyles";
import { useContentChange } from "./useContentChange";

interface EditorContentProps {
  content: string;
  onChange: (content: string) => void; 
  onContentUpdate?: (content: string) => void;
  onAutoSave?: () => void; 
  autoSaveDelay?: number;
  hasConclusion?: boolean;
}

/**
 * A rich text editor component that provides content editing capabilities
 */
const EditorContent: React.FC<EditorContentProps> = ({ 
  content,
  onChange, 
  onContentUpdate,
  onAutoSave,
  autoSaveDelay = 3000,
  hasConclusion = true,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Handle content changes
  const { handleContentChange } = useContentChange({
    onChange,
    onContentUpdate,
    onAutoSave,
    autoSaveDelay,
    editorRef
  });
  
  // Set initial content when the component mounts
  useEffect(() => {
    if (editorRef.current) {
      // Convert string content to actual HTML
      editorRef.current.innerHTML = content || '';
      
      // Format any checkboxes that might be in the content
      formatCheckboxes();
      
      // Keep focus in the editor after applying formatting
      const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const isInEditor = editorRef.current?.contains(range.commonAncestorContainer);
          if (isInEditor) {
            editorRef.current?.focus();
          }
        }
      };
      
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }
  }, [content]);
  
  // Format checkboxes when needed
  const formatCheckboxes = () => {
    if (!editorRef.current) return;
    
    // Find all possible checkbox patterns and replace them
    const allParagraphs = editorRef.current.querySelectorAll('p');
    allParagraphs.forEach(paragraph => {
      const text = paragraph.textContent || '';
      
      // Check if the paragraph starts with '[ ]' or '[x]' or '[]'
      if (text.trim().startsWith('[ ]') || text.trim().startsWith('[x]') || text.trim().startsWith('[]')) {
        // Create a checkbox element
        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.className = 'editor-checkbox';
        
        // Set checkbox state based on content
        checkboxInput.checked = text.trim().startsWith('[x]');
        
        // Make it editable within the contenteditable area
        checkboxInput.contentEditable = 'false';
        
        // Add change handler for the checkbox
        checkboxInput.addEventListener('change', (e) => {
          e.preventDefault();
          e.stopPropagation();
          // This just toggles the visual state but doesn't modify the content
          // The actual content change is handled in the parent
        });
        
        // Replace the text marker with the actual checkbox
        const label = document.createElement('span');
        label.className = 'checkbox-label';
        label.textContent = text.replace(/^\s*\[\s*x?\s*\]\s*/, '');
        
        // Clear paragraph and add new elements
        paragraph.innerHTML = '';
        paragraph.appendChild(checkboxInput);
        paragraph.appendChild(label);
        paragraph.className = 'checkbox-item';
      }
    });
  };

  return (
    <div 
      className="p-4 min-h-[300px] h-full w-full focus:outline-none overflow-auto text-sm editor-content"
      ref={editorRef}
      contentEditable
      onInput={handleContentChange}
      onBlur={handleContentChange}
      style={{ 
        lineHeight: '1.5',
        // Add these styles to better handle tables and overflow
        overflowX: 'auto',
        overflowY: 'auto',
        whiteSpace: 'normal',
        // Reduced top padding
        paddingTop: "8px",
        // Ensure content wraps within the container
        wordWrap: "break-word",
        wordBreak: "break-word",
        // Maximum width to prevent horizontal overflow
        maxWidth: "100%"
      }}
      data-placeholder="Start writing..."
    >
      {/* Style definitions for headings and lists within the editor */}
      <ContentStyles />
    </div>
  );
};

export default EditorContent;
