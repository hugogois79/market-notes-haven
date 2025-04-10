
import { RefObject, useEffect } from 'react';
import { addBulletPoint, addNumberedPoint } from '../formatting/formatters/listFormatters';

export const useKeyboardShortcuts = (
  editorRef: RefObject<HTMLDivElement>,
  execCommand: (command: string, value?: string) => void,
  formatTableCells: (alignment: string) => void
) => {
  // Setup keyboard shortcuts for text formatting
  useEffect(() => {
    if (!editorRef.current) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only apply shortcuts when editor is focused
      if (!editorRef.current?.contains(document.activeElement) && document.activeElement !== editorRef.current) return;
      
      // Handle ALT key combinations
      if (e.altKey) {
        // Log key press for debugging
        console.log('ALT key combination:', e.key, 'KeyCode:', e.keyCode);
        
        // For numeric keys, we need to handle them with special care
        // Handle number 3 and hash (#) - Alt+3 key can register as either
        if (e.key === '3' || e.key === '#') {
          e.preventDefault();
          console.log('Applying H3 heading');
          
          // Focus the editor first
          editorRef.current?.focus();
          
          // Apply h3 formatting directly
          document.execCommand('formatBlock', false, '<h3>');
          
          // Trigger input event to ensure changes are registered
          const inputEvent = new Event('input', { bubbles: true });
          editorRef.current?.dispatchEvent(inputEvent);
          
          return;
        }
        
        switch (e.key) {
          // Heading shortcuts - handle both numpad and regular number keys
          case '1': // Heading 1
          case '!': // Sometimes ALT+1 registers as !
            e.preventDefault();
            execCommand('formatBlock', '<h1>');
            break;
          case '2': // Heading 2
          case '@': // Sometimes ALT+2 registers as @
            e.preventDefault();
            execCommand('formatBlock', '<h2>');
            break;
          // We've moved the H3 case outside the switch for special handling
          case '0': // Normal text
          case ')': // Sometimes ALT+0 registers as )
            e.preventDefault();
            execCommand('formatBlock', '<p>');
            break;
          
          // Text formatting shortcuts
          case 'b': // Bold text
          case 'B': // Handle uppercase too
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i': // Italic text
          case 'I':
            e.preventDefault();
            execCommand('italic');
            break;
          case 'u': // Underline text
          case 'U':
            e.preventDefault();
            execCommand('underline');
            break;
          
          // Text alignment shortcuts
          case 'c': // Center align
          case 'C':
            e.preventDefault();
            formatTableCells('center');
            break;
          case 'l': // Left align
          case 'L':
            e.preventDefault();
            formatTableCells('left');
            break;
          case 'r': // Right align
          case 'R':
            e.preventDefault();
            formatTableCells('right');
            break;
          case 'j': // Justify text
          case 'J':
            e.preventDefault();
            formatTableCells('justify');
            break;
          
          // Special formatting
          case 'h': // Highlight text
          case 'H':
            e.preventDefault();
            document.execCommand('backColor', false, '#FEF7CD');
            break;
        }
        
        // Handle list formatting shortcuts outside of switch for better clarity
        // These need to be handled specially since 'u' is already used for underline
        if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          console.log('Alt+O pressed - adding numbered list');
          addNumberedPoint(editorRef);
        } else if ((e.key === 'u' || e.key === 'U') && e.altKey) {
          e.preventDefault();
          console.log('Alt+U pressed - adding bullet list');
          addBulletPoint(editorRef);
        }
      }
    };
    
    // Add event listener for keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editorRef, execCommand, formatTableCells]);
};
