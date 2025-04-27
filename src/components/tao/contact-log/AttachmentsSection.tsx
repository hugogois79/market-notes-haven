
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Paperclip, Loader2, X, Plus } from "lucide-react";
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
      
      // Filter out any failed uploads (null values)
      const successfulUploads = urls.filter((url): url is string => url !== null);
      
      if (successfulUploads.length > 0) {
        // Create a new array with existing attachments and add the new ones
        const updatedAttachments = [...attachments, ...successfulUploads];
        onAttachmentsChange(updatedAttachments);
        toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      // Clear the file input to allow selecting the same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (urlToRemove: string) => {
    onAttachmentsChange(attachments.filter(url => url !== urlToRemove));
    toast.success("Attachment removed");
  };

  const addMoreFiles = () => {
    fileInputRef.current?.click();
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
        
        <div className="flex gap-2">
          {attachments.length === 0 ? (
            <Button 
              type="button"
              variant="outline" 
              className="w-full flex items-center justify-center gap-2" 
              onClick={addMoreFiles}
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
                  Upload Files
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={addMoreFiles}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add More Files
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentsSection;

