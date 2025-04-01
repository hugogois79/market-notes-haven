
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
        element.style.fontSize = '1.1rem';
        element.style.fontWeight = '600';
        element.style.marginTop = '0.5rem';
        element.style.marginBottom = '0.2rem';
      }
    } else if (value === "<h2>") {
      element = container.nodeType === 1 
        ? (container as Element).closest('h2') 
        : (container.parentElement?.closest('h2'));
      
      if (element && element instanceof HTMLElement) {
        element.style.fontSize = '1rem';
        element.style.fontWeight = '500';
        element.style.marginTop = '0.4rem';
        element.style.marginBottom = '0.2rem';
        
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
        element.style.fontSize = '0.9rem'; // Smaller font size for H3
        element.style.fontWeight = '500';
        element.style.marginTop = '0.3rem';
        element.style.marginBottom = '0.1rem';
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

/**
 * Formats checkbox text into actual checkboxes
 */
export function formatCheckboxText(editorRef: HTMLDivElement | null) {
  if (!editorRef) return;
  
  // Find all paragraphs that might contain checkbox patterns
  const paragraphs = editorRef.querySelectorAll('p');
  paragraphs.forEach(paragraph => {
    const text = paragraph.textContent || '';
    
    // Check for checkbox patterns: [ ], [x], or []
    if (text.trim().startsWith('[ ]') || text.trim().startsWith('[x]') || text.trim().startsWith('[]')) {
      // Create checkbox element
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = text.trim().startsWith('[x]');
      checkbox.className = 'editor-checkbox';
      checkbox.contentEditable = 'false';
      
      // Create label for checkbox
      const label = document.createElement('span');
      label.className = 'checkbox-label';
      label.textContent = text.replace(/^\s*\[\s*x?\s*\]\s*/, '');
      
      // Update paragraph
      paragraph.innerHTML = '';
      paragraph.className = 'checkbox-item';
      paragraph.appendChild(checkbox);
      paragraph.appendChild(label);
    }
  });
}

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
