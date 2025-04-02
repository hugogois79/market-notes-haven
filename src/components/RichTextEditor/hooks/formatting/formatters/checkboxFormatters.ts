
/**
 * Specialized formatting utilities for checkboxes
 */

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
