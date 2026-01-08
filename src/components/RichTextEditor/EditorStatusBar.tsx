import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Clock, Copy, Printer, Trash2, ChevronDown, FileText, Files } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isPdfUrl } from "@/utils/pdfMerger";
import { preopenPrintWindow } from "@/utils/printUtils";

interface EditorStatusBarProps {
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onPrint?: () => void;
  onPrintWithAttachments?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  canDelete?: boolean;
  attachments?: string[];
  noteContent?: {
    title: string;
    category: string;
    content: string;
    tags?: string[];
    summary?: string;
  };
}

const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  isSaving,
  lastSaved,
  onSave,
  onPrint,
  onPrintWithAttachments,
  onDelete,
  isDeleting = false,
  canDelete = false,
  attachments = [],
  noteContent
}) => {
  // Check if there are PDF attachments
  const pdfAttachments = attachments.filter(url => url && isPdfUrl(url));
  const hasPdfAttachments = pdfAttachments.length > 0;
  const handleCopyToClipboard = async () => {
    if (!noteContent) {
      toast.error("No content to copy");
      return;
    }

    try {
      // Create a formatted text version of the note
      let textToCopy = `Title: ${noteContent.title}\n`;
      textToCopy += `Category: ${noteContent.category}\n`;
      
      if (noteContent.tags && noteContent.tags.length > 0) {
        textToCopy += `Tags: ${noteContent.tags.join(", ")}\n`;
      }
      
      if (noteContent.summary) {
        textToCopy += `\nSummary:\n${noteContent.summary}\n`;
      }
      
      textToCopy += `\nContent:\n${noteContent.content}`;

      await navigator.clipboard.writeText(textToCopy);
      toast.success("Note copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      toast.success("Preparing note for printing...");
    }
  };

  return (
    <div className="flex items-center justify-between py-1 px-2 bg-muted/30 text-xs text-muted-foreground border-t border-b">
      <div className="flex items-center gap-2">
        <Clock size={12} />
        <span>
          {lastSaved
            ? `Last saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
            : "Not saved yet"}
        </span>
        {isSaving && <span className="text-blue-500 animate-pulse">Saving...</span>}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs flex items-center gap-1"
          onClick={handleCopyToClipboard}
          title="Copy note content to clipboard"
        >
          <Copy size={12} />
          Copy
        </Button>
        
        {onPrint && (
          hasPdfAttachments ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs flex items-center gap-1"
                  title="Print options"
                >
                  <Printer size={12} />
                  Print
                  <ChevronDown size={10} className="ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[200] bg-popover">
                <DropdownMenuItem
                  onSelect={() => {
                    handlePrint();
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Note Only
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    // Pre-open a window synchronously to avoid popup blockers.
                    // The print util will reuse this window.
                    preopenPrintWindow();
                    toast.info("A preparar PDF combinado...");
                    onPrintWithAttachments?.();
                  }}
                >
                  <Files className="h-4 w-4 mr-2" />
                  Print with Attachments ({pdfAttachments.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs flex items-center gap-1"
              onClick={handlePrint}
              title="Print note"
            >
              <Printer size={12} />
              Print
            </Button>
          )
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs flex items-center gap-1"
          onClick={onSave}
          disabled={isSaving}
        >
          <Save size={12} />
          Save
        </Button>

        {canDelete && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs flex items-center gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isDeleting}
                title="Delete note"
              >
                <Trash2 size={12} />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="z-[200]">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  note from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default EditorStatusBar;
