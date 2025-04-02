
/**
 * Specialized formatting utilities for lists
 */

/**
 * Applies list formatting with consistent styles
 */
export function applyListFormatting(command: string, value: string, selection: Selection | null) {
  if (!selection) return;
  
  document.execCommand(command, false, value);
  
  // Apply additional styling to the created list
  if (selection && selection.rangeCount > 0) {
    const container = selection.getRangeAt(0).commonAncestorContainer;
    const listElement = container.nodeType === 1 
      ? (container as Element).closest('ul, ol') 
      : (container.parentElement?.closest('ul, ol'));
    
    if (listElement && listElement instanceof HTMLElement) {
      if (listElement.tagName === 'UL') {
        listElement.style.listStyleType = 'disc';
      } else if (listElement.tagName === 'OL') {
        listElement.style.listStyleType = 'decimal';
      }
      listElement.style.paddingLeft = '1.2rem';
      listElement.style.margin = '0.2rem 0';
      
      // Style list items
      const items = listElement.querySelectorAll('li');
      items.forEach(item => {
        (item as HTMLElement).style.marginBottom = '0.1rem';
      });
    }
  }
}
