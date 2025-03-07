
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paperclip, FileIcon, ExternalLink, Trash2, X } from "lucide-react";
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

interface AttachmentSectionProps {
  attachmentFile: File | null;
  attachmentUrl: string | undefined;
  handleAttachFileClick: () => void;
  handleRemoveAttachment: () => void;
  setAttachmentFile: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getFilenameFromUrl: (url: string) => string;
}

const AttachmentSection = ({
  attachmentFile,
  attachmentUrl,
  handleAttachFileClick,
  handleRemoveAttachment,
  setAttachmentFile,
  fileInputRef,
  handleFileChange,
  getFilenameFromUrl,
}: AttachmentSectionProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Paperclip size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Attachment</span>
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        {attachmentFile ? (
          <Badge variant="secondary" className="px-3 py-1 text-sm gap-2">
            <FileIcon size={14} />
            {attachmentFile.name}
            <button 
              onClick={() => setAttachmentFile(null)} 
              className="opacity-70 hover:opacity-100"
            >
              <X size={12} />
            </button>
          </Badge>
        ) : attachmentUrl ? (
          <div className="flex gap-2 items-center">
            <Badge variant="secondary" className="px-3 py-1 text-sm gap-2">
              <FileIcon size={14} />
              {getFilenameFromUrl(attachmentUrl)}
              <a 
                href={attachmentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 ml-1"
              >
                <ExternalLink size={12} />
              </a>
            </Badge>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2"
                >
                  <Trash2 size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove attachment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the file attachment from this note. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveAttachment}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAttachFileClick}
            className="gap-2 h-8"
          >
            <Paperclip size={14} />
            Attach File
          </Button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        />
      </div>
      <div className="text-xs text-muted-foreground">
        Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (max 10MB)
      </div>
    </div>
  );
};

export default AttachmentSection;
