
import { useState, useEffect } from 'react';

export const useSummaryParser = (initialSummary: string = "", noteId: string) => {
  const [summary, setSummary] = useState<string>("");
  
  useEffect(() => {
    // Skip processing for new/temporary notes
    if (noteId.startsWith('temp-')) {
      setSummary("");
      return;
    }
    
    // Process the summary if available
    if (initialSummary) {
      try {
        // Check if the summary is in JSON format
        const parsedSummary = JSON.parse(initialSummary);
        
        // If it's JSON, extract the summary field
        if (parsedSummary && typeof parsedSummary === 'object' && parsedSummary.summary) {
          setSummary(parsedSummary.summary);
        } else {
          // Use the JSON content directly
          setSummary(initialSummary);
        }
      } catch (e) {
        // Not JSON, use the summary as-is
        setSummary(initialSummary);
      }
    } else {
      // No summary available
      setSummary("");
    }
  }, [initialSummary, noteId]);
  
  return summary;
};
