
import { Note } from "@/types";
import { generatePrintHtml } from "../htmlGenerator";
import { normalizeContent } from "../styles/normalizeStyles";
import { enhanceVacationContent } from "./vacationEnhancer";

/**
 * Handles printing a note with special handling for vacation notes
 */
export const printNote = (noteData: Partial<Note>): void => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    console.error('Could not open print window - popup blocker?');
    return;
  }
  
  // Process summary if it exists to handle potential JSON format
  let processedSummary = noteData.summary;
  if (processedSummary) {
    try {
      const parsedSummary = JSON.parse(processedSummary);
      if (parsedSummary && typeof parsedSummary === 'object' && parsedSummary.summary) {
        processedSummary = parsedSummary.summary;
      }
    } catch (e) {
      processedSummary = noteData.summary;
    }
  }
  
  // Normalize content to fix font weight issues
  let normalizedContent = noteData.content ? normalizeContent(noteData.content) : '';
  
  // Check if this is a vacation note and apply special formatting
  const isVacationNote = noteData.category === 'Vacations' || noteData.category === 'Vacation';
  
  if (isVacationNote) {
    // Process vacation content to center text and enhance formatting
    normalizedContent = enhanceVacationContent(normalizedContent);
  }
  
  // Create a complete Note object with default values for required properties
  const note: Note = {
    id: "temp-print-id",
    title: noteData.title || "Untitled Note",
    content: normalizedContent,
    tags: noteData.tags || [],
    category: noteData.category || "Uncategorized",
    createdAt: noteData.createdAt || new Date(),
    updatedAt: noteData.updatedAt || new Date(),
    attachment_url: noteData.attachment_url,
    summary: processedSummary,
    tradeInfo: noteData.tradeInfo
  };
  
  // Generate the HTML content
  const printContent = generatePrintHtml(note);
  
  // Write the content to the new window and trigger printing
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for images to load before printing
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      
      // Close the window after printing (some browsers may do this automatically)
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 500);
    }, 1000); // Allow more time for vacation photos to load
  };
};
