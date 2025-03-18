
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
  attachmentUrl?: string;
}

const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  content,
  title,
  category,
  attachmentUrl,
}) => {
  const handlePrint = useCallback(() => {
    printNote({
      content,
      title: title || "Untitled Note",
      category: category || "Uncategorized",
      attachment_url: attachmentUrl, // Fix: Changed from attachmentUrl to attachment_url
    });
    onClose();
  }, [content, title, category, attachmentUrl, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print Note</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This will open the print dialog to print your note or save it as a PDF.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePrint}>Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintModal;
