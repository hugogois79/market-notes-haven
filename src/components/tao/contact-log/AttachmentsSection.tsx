
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Paperclip, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadContactLogAttachment } from "@/services/contact-logs/contactLogService";

interface AttachmentsSectionProps {
  validatorId: string;
  attachments: string[];
  onAttachmentsChange: (urls: string[]) => void;
}

const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  validatorId,
  attachments,
  onAttachmentsChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !validatorId) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => uploadContactLogAttachment(validatorId, file));
      const urls = await Promise.all(uploadPromises);
      
      const successfulUploads = urls.filter((url): url is string => url !== null);
      if (successfulUploads.length > 0) {
        onAttachmentsChange([...attachments, ...successfulUploads]);
        toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (urlToRemove: string) => {
    onAttachmentsChange(attachments.filter(url => url !== urlToRemove));
    toast.success("Attachment removed");
  };

  return (
    <div className="space-y-2">
      <Label>Attachments</Label>
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      <div className="space-y-2">
        {attachments.map((url) => (
          <div key={url} className="border rounded-md p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <Paperclip className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm truncate">
                {new URL(url).pathname.split('/').pop()}
              </span>
            </div>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => removeAttachment(url)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <Button 
          type="button"
          variant="outline" 
          className="w-full flex items-center justify-center gap-2" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {attachments.length === 0 ? 'Upload Files' : 'Add More Files'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AttachmentsSection;
