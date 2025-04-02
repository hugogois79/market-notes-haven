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
        // Remove bullet styling for unordered lists
        listElement.style.listStyleType = 'none';
        listElement.style.paddingLeft = '0.5rem';
      } else if (listElement.tagName === 'OL') {
        listElement.style.listStyleType = 'decimal';
        listElement.style.paddingLeft = '1.5rem';
      }
      
      // Apply more professional spacing
      listElement.style.margin = '0.25rem 0';
      
      // Style list items
      const items = listElement.querySelectorAll('li');
      items.forEach(item => {
        if (item instanceof HTMLElement) {
          item.style.marginBottom = '0.15rem';
          item.style.lineHeight = '1.4';
          item.style.fontSize = '0.95rem';
          
          // Remove bullet styling
          item.style.display = 'block';
          item.style.position = 'relative';
          
          // Add a slight indent for readability without bullets
          if (listElement.tagName === 'UL') {
            item.style.textIndent = '0';
            
            // Add a small indicator instead of bullets for better readability
            if (!item.querySelector('.custom-list-marker')) {
              const marker = document.createElement('span');
              marker.className = 'custom-list-marker';
              marker.style.display = 'inline-block';
              marker.style.width = '8px';
              marker.style.marginRight = '4px';
              
              // Keep the element but make it invisible
              item.insertBefore(marker, item.firstChild);
            }
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
      // Apply no bullet style
      list.style.listStyleType = 'none';
      list.style.paddingLeft = '0.5rem';
      list.style.margin = '0.25rem 0';
      
      // Style each list item
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        if (item instanceof HTMLElement) {
          item.style.marginBottom = '0.15rem';
          item.style.lineHeight = '1.4';
          item.style.fontSize = '0.95rem';
          item.style.display = 'block';
          item.style.position = 'relative';
          item.style.textIndent = '0';
          
          // If the item doesn't have our custom marker, add it
          if (!item.querySelector('.custom-list-marker')) {
            const marker = document.createElement('span');
            marker.className = 'custom-list-marker';
            marker.style.display = 'inline-block';
            marker.style.width = '8px';
            marker.style.marginRight = '4px';
            
            // Insert at the beginning
            if (item.firstChild) {
              item.insertBefore(marker, item.firstChild);
            } else {
              item.appendChild(marker);
            }
          }
        }
      });
    }
  });
}
