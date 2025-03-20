
import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { printNote } from "@/utils/printUtils";

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  category: string;
  summary?: string;
  attachmentUrl?: string;
}

const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  content,
  title,
  category,
  summary,
  attachmentUrl,
}) => {
  const handlePrint = useCallback(() => {
    // Clean up any potential font-weight styles that might be causing issues
    let processedContent = content;
    
    // Only process if content exists
    if (processedContent) {
      // Ensure we're not inadvertently making all text bold
      processedContent = processedContent
        // Add normal font-weight to paragraphs without explicit font-weight
        .replace(/<p([^>]*?)>/gi, function(match, p1) {
          // Only add font-weight: normal if font-weight isn't already specified
          if (!/font-weight/i.test(p1)) {
            return `<p${p1} style="font-weight: normal;">`;
          }
          return match;
        });
    }
    
    printNote({
      content: processedContent,
      title: title || "Untitled Note",
      category: category || "Uncategorized",
      summary,
      attachment_url: attachmentUrl,
    });
    
    onClose();
  }, [content, title, category, summary, attachmentUrl, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print Note</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-xs text-muted-foreground">
            This will open the print dialog to print your note or save it as a PDF.
            {summary && (
              <span className="block mt-2 text-blue-600">
                Your AI summary will appear at the top of the printed document.
              </span>
            )}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} size="sm" className="text-xs">
            Cancel
          </Button>
          <Button onClick={handlePrint} size="sm" className="text-xs">
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintModal;
