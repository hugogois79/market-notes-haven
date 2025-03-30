
import { RefObject, useEffect } from 'react';

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
      if (!editorRef.current?.contains(document.activeElement)) return;
      
      // Handle ALT key combinations
      if (e.altKey) {
        // Log key press for debugging
        console.log('ALT key combination:', e.key, 'KeyCode:', e.keyCode);
        
        switch (e.key.toLowerCase()) { // Convert to lowercase to handle both upper and lowercase
          case '1': // Heading 1
            e.preventDefault();
            execCommand('formatBlock', '<h1>');
            break;
          case '2': // Heading 2
            e.preventDefault();
            execCommand('formatBlock', '<h2>');
            break;
          case '3': // Heading 3
            e.preventDefault();
            execCommand('formatBlock', '<h3>');
            break;
          case '0': // Normal text
            e.preventDefault();
            execCommand('formatBlock', '<p>');
            break;
          case 'b': // Bold text - toggle bold
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i': // Italic text
            e.preventDefault();
            execCommand('italic');
            break;
          case 'c': // Center align
            e.preventDefault();
            execCommand('justifyCenter');
            formatTableCells('center');
            break;
          case 'l': // Left align
            e.preventDefault();
            execCommand('justifyLeft');
            formatTableCells('left');
            break;
          case 'r': // Right align
            e.preventDefault();
            execCommand('justifyRight');
            formatTableCells('right');
            break;
          case 'j': // Justify text
            e.preventDefault();
            execCommand('justifyFull');
            formatTableCells('justify');
            break;
          case 'h': // Highlight text
            e.preventDefault();
            document.execCommand('backColor', false, '#FEF7CD');
            break;
          case 'u': // Underline text
            e.preventDefault();
            execCommand('underline');
            break;
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
