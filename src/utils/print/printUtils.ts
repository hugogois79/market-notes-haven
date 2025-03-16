
import { Note } from "@/types";
import { generatePrintHtml } from "./htmlGenerator";

/**
 * Handles printing a note
 */
export const printNote = (note: Note): void => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    console.error('Could not open print window - popup blocker?');
    return;
  }
  
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
