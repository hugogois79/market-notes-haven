import { RefObject } from "react";

/**
 * Apply list formatting to selected content
 */
export const applyListFormatting = (editorRef: RefObject<HTMLDivElement>, listType: 'ul' | 'ol'): void => {
  if (!editorRef.current) return;
  
  // Focus the editor first
  editorRef.current.focus();
  
  // Use browser's execCommand to apply list formatting
  document.execCommand(listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false);
  
  // Find all the lists we just created and apply proper styling
  const lists = editorRef.current.querySelectorAll(listType);
  
  lists.forEach(list => {
    if (list instanceof HTMLElement) {
      list.style.paddingLeft = '2rem';
      list.style.margin = '0.5rem 0';
      
      if (listType === 'ul') {
        list.style.listStyleType = 'disc';
      } else if (listType === 'ol') {
        list.style.listStyleType = 'decimal';
      }
      
      // Ensure items are properly styled
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        if (item instanceof HTMLElement) {
          item.style.margin = '0.25rem 0';
        }
      });
    }
  });
  
  // Ensure the content change is registered
  if (editorRef.current) {
    const inputEvent = new Event('input', { bubbles: true });
    editorRef.current.dispatchEvent(inputEvent);
  }
};

/**
 * Process existing lists to ensure proper formatting
 */
export const processExistingListsFormatting = (editorRef: RefObject<HTMLDivElement>): void => {
  if (!editorRef.current) return;
  
  // Process all lists to ensure they have proper styles
  const allLists = editorRef.current.querySelectorAll('ul, ol');
  
  allLists.forEach(list => {
    if (list instanceof HTMLElement) {
      // Apply appropriate styling based on list type
      if (list.tagName === 'UL') {
        list.style.listStyleType = 'disc';
        list.style.paddingLeft = '2rem';
        list.style.margin = '0.5rem 0';
      } else if (list.tagName === 'OL') {
        list.style.listStyleType = 'decimal';
        list.style.paddingLeft = '2rem';
        list.style.margin = '0.5rem 0';
        
        // Reset counter for ordered lists
        list.style.counterReset = 'item';
        
        // Process all list items for ordered lists
        const items = list.querySelectorAll('li');
        items.forEach((item, index) => {
          if (item instanceof HTMLElement) {
            item.style.counterIncrement = 'item';
            // Add a data attribute to keep track of the index
            item.setAttribute('data-index', String(index + 1));
          }
        });
      }
      
      // Style all list items
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        if (item instanceof HTMLElement) {
          item.style.margin = '0.25rem 0';
          item.style.display = 'list-item';
        }
      });
    }
  });
};

/**
 * Add a bullet point at the current cursor position
 */
export const addBulletPoint = (editorRef: RefObject<HTMLDivElement>): void => {
  if (!editorRef.current) return;
  
  // Focus the editor
  editorRef.current.focus();
  
  // Insert an unordered list
  document.execCommand('insertUnorderedList', false);
  
  // Process the list to ensure proper formatting
  processExistingListsFormatting(editorRef);
};

/**
 * Add a numbered point at the current cursor position
 */
export const addNumberedPoint = (editorRef: RefObject<HTMLDivElement>): void => {
  if (!editorRef.current) return;
  
  // Focus the editor
  editorRef.current.focus();
  
  // Insert an ordered list
  document.execCommand('insertOrderedList', false);
  
  // Process the list to ensure proper formatting
  processExistingListsFormatting(editorRef);
};

/**
 * Reset the numbering for ordered lists
 */
export const resetListNumbering = (editorRef: RefObject<HTMLDivElement>): void => {
  if (!editorRef.current) return;
  
  // Find all ordered lists
  const orderedLists = editorRef.current.querySelectorAll('ol');
  
  orderedLists.forEach(list => {
    if (list instanceof HTMLElement) {
      // Reset the counter
      list.style.counterReset = 'item';
      
      // Update each item's counter increment
      const items = list.querySelectorAll('li');
      items.forEach((item, index) => {
        if (item instanceof HTMLElement) {
          item.style.counterIncrement = 'item';
          item.setAttribute('data-index', String(index + 1));
        }
      });
    }
  });
};
