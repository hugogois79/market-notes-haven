
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
        // Apply proper bullet styling for unordered lists
        listElement.style.listStyleType = 'disc';
        listElement.style.paddingLeft = '1rem';
      } else if (listElement.tagName === 'OL') {
        // Apply proper number styling for ordered lists
        listElement.style.listStyleType = 'decimal';
        listElement.style.paddingLeft = '1rem';
      }
      
      // Apply compact spacing
      listElement.style.margin = '0.15rem 0';
      
      // Style list items
      const items = listElement.querySelectorAll('li');
      items.forEach(item => {
        if (item instanceof HTMLElement) {
          item.style.marginBottom = '0.1rem';
          item.style.lineHeight = '1.2';
          item.style.fontSize = '0.85rem';
          
          // Ensure proper list display with visible markers
          item.style.display = 'list-item';
          item.style.position = 'relative';
          
          // Remove any custom markers that might have been added previously
          const customMarker = item.querySelector('.custom-list-marker');
          if (customMarker) {
            customMarker.remove();
          }
        }
      });
    }
  }
}

/**
 * Process any existing content to ensure proper formatting
 */
export function processExistingListsFormatting(editorRef: React.RefObject<HTMLDivElement>) {
  if (!editorRef.current) return;
  
  // Find all unordered lists in the editor
  const unorderedLists = editorRef.current.querySelectorAll('ul');
  unorderedLists.forEach(list => {
    if (list instanceof HTMLElement) {
      // Apply bullet style
      list.style.listStyleType = 'disc';
      list.style.paddingLeft = '1rem';
      list.style.margin = '0.15rem 0';
      
      // Style each list item
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        if (item instanceof HTMLElement) {
          item.style.marginBottom = '0.1rem';
          item.style.lineHeight = '1.2';
          item.style.fontSize = '0.85rem';
          item.style.display = 'list-item';
          
          // Remove any custom markers that might have been added previously
          const customMarker = item.querySelector('.custom-list-marker');
          if (customMarker) {
            customMarker.remove();
          }
        }
      });
    }
  });
  
  // Find all ordered lists in the editor
  const orderedLists = editorRef.current.querySelectorAll('ol');
  orderedLists.forEach(list => {
    if (list instanceof HTMLElement) {
      // Apply decimal number style with stronger visibility
      list.style.listStyleType = 'decimal';
      list.style.paddingLeft = '1rem';
      list.style.margin = '0.15rem 0';
      list.style.counterReset = 'item'; // Reset counter for each list
      
      // Style each list item
      const items = list.querySelectorAll('li');
      items.forEach((item, index) => {
        if (item instanceof HTMLElement) {
          item.style.marginBottom = '0.1rem';
          item.style.lineHeight = '1.2';
          item.style.fontSize = '0.85rem';
          item.style.display = 'list-item';
          item.style.counterIncrement = 'item'; // Increment counter for each item
          
          // Ensure the list item is properly numbered
          item.setAttribute('data-index', String(index + 1));
        }
      });
    }
  });
}

/**
 * Adds a bulletpoint to the current selection
 */
export function addBulletPoint() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  
  document.execCommand('insertUnorderedList', false);
  
  // Ensure proper styling
  applyListFormatting('insertUnorderedList', '', selection);
}

/**
 * Adds a numbered point to the current selection
 */
export function addNumberedPoint() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  
  document.execCommand('insertOrderedList', false);
  
  // Ensure proper styling
  applyListFormatting('insertOrderedList', '', selection);
}

/**
 * Reset list numbering when needed
 */
export function resetListNumbering(editorRef: React.RefObject<HTMLDivElement>) {
  if (!editorRef.current) return;
  
  // Find all ordered lists
  const orderedLists = editorRef.current.querySelectorAll('ol');
  orderedLists.forEach(list => {
    if (list instanceof HTMLElement) {
      // Reset counter for this list
      list.style.counterReset = 'item';
      
      // Update each list item's counter
      const items = list.querySelectorAll('li');
      items.forEach((item, index) => {
        if (item instanceof HTMLElement) {
          item.style.counterIncrement = 'item';
          item.setAttribute('data-index', String(index + 1));
        }
      });
    }
  });
}
