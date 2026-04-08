
import { RefObject } from "react";

/**
 * Apply consistent formatting to list elements
 */
export const applyListFormatting = (command: string, value: string, selection: Selection | null) => {
  if (!selection) return;
  
  // Execute the list command
  document.execCommand(command, false, value);
  
  // Find all lists within the selection and format them
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  let parentElement = container.nodeType === 1 
    ? container as Element 
    : container.parentElement;
    
  // Go up to find the editor container
  while (parentElement && !parentElement.classList.contains('editor-content')) {
    parentElement = parentElement.parentElement as Element;
  }
  
  if (parentElement) {
    const lists = parentElement.querySelectorAll('ul, ol');
    lists.forEach(list => {
      if (list instanceof HTMLElement) {
        list.style.marginLeft = '2rem';
        list.style.marginTop = '0.3rem';
        list.style.marginBottom = '0.3rem';
        
        if (list.tagName === 'UL') {
          list.style.listStyleType = 'disc';
        } else if (list.tagName === 'OL') {
          list.style.listStyleType = 'decimal';
          list.style.counterReset = 'item';
          resetListNumbering(list);
        }
      }
    });
  }
};

/**
 * Format existing lists in the editor to ensure they have proper styling and numbering
 */
export const processExistingListsFormatting = (editorRef: RefObject<HTMLDivElement>) => {
  if (!editorRef.current) return;
  
  // Format all unordered lists
  const unorderedLists = editorRef.current.querySelectorAll('ul');
  unorderedLists.forEach(list => {
    if (list instanceof HTMLElement) {
      list.style.listStyleType = 'disc';
      list.style.paddingLeft = '2rem';
      list.style.marginTop = '0.3rem';
      list.style.marginBottom = '0.3rem';
      list.style.display = 'block';
      
      // Ensure each list item is displayed correctly
      const listItems = list.querySelectorAll('li');
      listItems.forEach(item => {
        if (item instanceof HTMLElement) {
          item.style.display = 'list-item';
          item.style.marginBottom = '0.1rem';
        }
      });
    }
  });
  
  // Format all ordered lists
  const orderedLists = editorRef.current.querySelectorAll('ol');
  orderedLists.forEach(list => {
    if (list instanceof HTMLElement) {
      list.style.listStyleType = 'decimal';
      list.style.paddingLeft = '2rem';
      list.style.marginTop = '0.3rem';
      list.style.marginBottom = '0.3rem';
      list.style.counterReset = 'item';
      list.style.display = 'block';
      
      // Reset numbering for this list
      resetListNumbering(list);
    }
  });
};

/**
 * Reset and fix the numbering of ordered lists
 */
export const resetListNumbering = (list: HTMLElement) => {
  if (list.tagName !== 'OL') return;
  
  // Get all list items
  const items = list.querySelectorAll('li');
  
  // Set counter increment for each item
  items.forEach((item, index) => {
    if (item instanceof HTMLElement) {
      item.style.counterIncrement = 'item';
      item.setAttribute('value', String(index + 1));
      item.style.display = 'list-item';
      item.style.marginBottom = '0.1rem';
    }
  });
};

/**
 * Add a bullet point at the current cursor position
 */
export const addBulletPoint = (editorRef: RefObject<HTMLDivElement>) => {
  if (!editorRef.current) return;
  
  console.log("Adding bullet point");
  
  // Focus the editor element first to ensure commands work
  editorRef.current.focus();
  
  // Create a bullet list
  document.execCommand('insertUnorderedList', false);
  
  // Format the list that was just created
  processExistingListsFormatting(editorRef);
  
  // Trigger a change event to ensure the editor updates
  const event = new Event('input', { bubbles: true });
  editorRef.current.dispatchEvent(event);
};

/**
 * Add a numbered point at the current cursor position
 */
export const addNumberedPoint = (editorRef: RefObject<HTMLDivElement>) => {
  if (!editorRef.current) return;
  
  console.log("Adding numbered point");
  
  // Focus the editor element first to ensure commands work
  editorRef.current.focus();
  
  // Create a numbered list
  document.execCommand('insertOrderedList', false);
  
  // Format the list that was just created
  processExistingListsFormatting(editorRef);
  
  // Trigger a change event to ensure the editor updates
  const event = new Event('input', { bubbles: true });
  editorRef.current.dispatchEvent(event);
};
