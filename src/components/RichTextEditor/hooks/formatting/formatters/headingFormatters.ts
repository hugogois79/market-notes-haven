
/**
 * Specialized formatting utilities for headings
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
        element.style.fontSize = '2rem';
        element.style.fontWeight = '700';
        element.style.marginTop = '1rem';
        element.style.marginBottom = '0.5rem';
        element.style.textDecoration = 'underline';
        element.style.paddingBottom = '0.2rem';
        element.style.color = '#000';
      }
    } else if (value === "<h2>") {
      element = container.nodeType === 1 
        ? (container as Element).closest('h2') 
        : (container.parentElement?.closest('h2'));
      
      if (element && element instanceof HTMLElement) {
        element.style.fontSize = '1.5rem';
        element.style.fontWeight = '600';
        element.style.marginTop = '0.8rem';
        element.style.marginBottom = '0.4rem';
        element.style.color = '#000';
        
        // If this is likely a section heading for trading frameworks, apply special styling
        const textContent = element.textContent?.toLowerCase() || '';
        if (textContent.includes('restart condition') || 
            textContent.includes('implementation checklist')) {
          element.style.color = '#1967d2';
          element.style.borderBottom = '1px solid #d1d5db';
          element.style.paddingBottom = '0.2rem';
        }
      }
    } else if (value === "<h3>") {
      element = container.nodeType === 1 
        ? (container as Element).closest('h3') 
        : (container.parentElement?.closest('h3'));
      
      if (element && element instanceof HTMLElement) {
        element.style.fontSize = '1.2rem';
        element.style.fontWeight = '500';
        element.style.marginTop = '0.6rem';
        element.style.marginBottom = '0.3rem';
        element.style.color = '#000';
      }
    } else if (value === "<p>") {
      element = container.nodeType === 1 
        ? (container as Element).closest('p') 
        : (container.parentElement?.closest('p'));
      
      if (element && element instanceof HTMLElement) {
        element.style.fontSize = '0.8rem';
        element.style.marginBottom = '0.2rem';
      }
    }
  }
}
