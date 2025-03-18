
import { Note } from "@/types";
import { generatePrintHtml } from "./htmlGenerator";

/**
 * Handles printing a note
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
      // Try to parse as JSON in case it's stored that way
      const parsedSummary = JSON.parse(processedSummary);
      if (parsedSummary && typeof parsedSummary === 'object' && parsedSummary.summary) {
        processedSummary = parsedSummary.summary;
      }
    } catch (e) {
      // Not JSON, use as-is
      processedSummary = noteData.summary;
    }
  }
  
  // Create a complete Note object with default values for required properties
  const note: Note = {
    id: "temp-print-id",
    title: noteData.title || "Untitled Note",
    content: noteData.content || "",
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
    // Trigger the print dialog
    printWindow.print();
    
    // Close the window after printing (some browsers may do this automatically)
    // Set a timeout to avoid closing before print dialog appears
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 500);
  };
};
