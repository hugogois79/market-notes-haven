
/**
 * Specialized formatting utilities for separators
 */

/**
 * Creates a horizontal separator with styling
 */
export function createSeparator(editorRef: HTMLDivElement | null) {
  if (!editorRef) return;
  
  console.log("Inserting separator");
  
  // Focus the editor first
  editorRef.focus();
  
  // Create HTML for a clean, styled separator
  const separatorHTML = `
    <div class="editor-separator" style="
      width: 100%;
      margin: 1rem 0;
      text-align: center;
      position: relative;
      clear: both;
    ">
      <hr style="
        border: none;
        height: 1px;
        background-color: #d1d5db;
        margin: 0;
      "/>
    </div>
    <p><br></p>
  `;
  
  // Insert the separator HTML
  document.execCommand('insertHTML', false, separatorHTML);
  
  // Trigger input event to ensure changes are registered
  const inputEvent = new Event('input', { bubbles: true });
  editorRef.dispatchEvent(inputEvent);
}
