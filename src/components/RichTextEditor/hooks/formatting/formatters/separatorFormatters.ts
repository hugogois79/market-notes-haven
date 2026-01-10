
/**
 * Specialized formatting utilities for separators
 */

/**
 * Creates a horizontal separator with minimal styling (single line)
 */
export function createSeparator(editorRef: HTMLDivElement | null) {
  if (!editorRef) return;
  
  // Focus the editor first
  editorRef.focus();
  
  // Create HTML for a clean, minimal separator - just a single hr line
  const separatorHTML = '<hr style="border: none; height: 1px; background-color: #d1d5db; margin: 0.5rem 0;" />';
  
  // Insert the separator HTML
  document.execCommand('insertHTML', false, separatorHTML);
  
  // Trigger input event to ensure changes are registered
  const inputEvent = new Event('input', { bubbles: true });
  editorRef.dispatchEvent(inputEvent);
}
