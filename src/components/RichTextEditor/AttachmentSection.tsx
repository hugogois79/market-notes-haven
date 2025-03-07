
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Paperclip, X, File, Upload, Loader } from "lucide-react";

interface AttachmentSectionProps {
  noteId: string;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({ noteId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Attachments</div>
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {!file && !attachmentUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full flex items-center gap-2"
          onClick={handleChooseFile}
        >
          <Paperclip size={14} />
          Attach file
        </Button>
      )}
      
      {file && (
        <div className="flex items-center gap-2 p-2 border rounded bg-secondary/20">
          <File size={16} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isUploading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleRemoveFile}
                >
                  <X size={14} />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      
      {attachmentUrl && (
        <div className="flex items-center gap-2 p-2 border rounded bg-secondary/20">
          <File size={16} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <a 
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm truncate hover:underline block"
            >
              Attachment
            </a>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setAttachmentUrl(null)}
          >
            <X size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AttachmentSection;
