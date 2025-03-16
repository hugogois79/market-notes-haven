
/**
 * Helper functions for text formatting in the editor
 */

/**
 * Applies heading formatting with consistent styles
 */
export function applyHeadingFormatting(command: string, value: string, selection: Selection | null) {
  if (!selection) return;
  
  document.execCommand(command, false, value);
  
  // Apply custom styles based on heading type
  if (selection && selection.rangeCount > 0) {
    const container = selection.getRangeAt(0).commonAncestorContainer;
    let element = null;
    
    if (value === "<h1>") {
      element = container.nodeType === 1 
        ? (container as Element).closest('h1') 
        : (container.parentElement?.closest('h1'));
      
      if (element && element instanceof HTMLElement) {
        element.style.fontSize = '1.5rem';
        element.style.fontWeight = '600';
        element.style.marginTop = '1rem';
        element.style.marginBottom = '0.5rem';
      }
    } else if (value === "<h2>") {
      element = container.nodeType === 1 
        ? (container as Element).closest('h2') 
        : (container.parentElement?.closest('h2'));
      
      if (element && element instanceof HTMLElement) {
        element.style.fontSize = '1.25rem';
        element.style.fontWeight = '500';
        element.style.marginTop = '0.75rem';
        element.style.marginBottom = '0.5rem';
      }
    } else if (value === "<h3>") {
      element = container.nodeType === 1 
        ? (container as Element).closest('h3') 
        : (container.parentElement?.closest('h3'));
      
      if (element && element instanceof HTMLElement) {
        element.style.fontSize = '1.05rem';
        element.style.fontWeight = '500';
        element.style.marginTop = '0.5rem';
        element.style.marginBottom = '0.25rem';
      }
    } else if (value === "<p>") {
      element = container.nodeType === 1 
        ? (container as Element).closest('p') 
        : (container.parentElement?.closest('p'));
      
      if (element && element instanceof HTMLElement) {
        element.style.fontSize = '0.875rem';
        element.style.marginBottom = '0.5rem';
      }
    }
  }
}

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
      listElement.style.paddingLeft = '2rem';
      listElement.style.margin = '0.5rem 0';
      
      // Style list items
      const items = listElement.querySelectorAll('li');
      items.forEach(item => {
        (item as HTMLElement).style.marginBottom = '0.25rem';
      });
    }
  }
}
