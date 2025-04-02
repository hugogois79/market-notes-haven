
/**
 * Specialized formatting utilities for separators
 */

/**
 * Creates a horizontal separator with styling
 */
export function createSeparator(editorRef: HTMLDivElement | null) {
  if (!editorRef) return;
  
  const separator = document.createElement('hr');
  separator.className = 'editor-separator';
  separator.style.border = 'none';
  separator.style.borderTop = '1px solid #d1d5db';
  separator.style.margin = '0.4rem 0';
  
  const range = window.getSelection()?.getRangeAt(0);
  if (range) {
    range.deleteContents();
    range.insertNode(separator);
    
    // Move cursor after the separator
    range.setStartAfter(separator);
    range.setEndAfter(separator);
    
    // Create a new paragraph after the separator if needed
    const paragraph = document.createElement('p');
    paragraph.innerHTML = '<br>';
    range.insertNode(paragraph);
    
    // Set focus to the new paragraph
    range.setStart(paragraph, 0);
    range.setEnd(paragraph, 0);
    range.collapse(true);
    
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}
