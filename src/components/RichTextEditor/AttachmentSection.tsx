
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ExternalLink, Image, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AttachmentSectionProps {
  noteId: string;
  attachmentUrl?: string | null;
  onAttachmentChange: (url: string | null) => void;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({ 
  noteId, 
  attachmentUrl, 
  onAttachmentChange 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localAttachmentUrl, setLocalAttachmentUrl] = useState<string | null>(attachmentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setLocalAttachmentUrl(attachmentUrl || null);
  }, [attachmentUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10MB.");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a unique filename to prevent collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${noteId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      console.log('Uploading file to Supabase storage...', fileName);
      
      // Get user auth status
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Upload to Supabase storage using the correct bucket name
      const { data, error } = await supabase.storage
        .from('note_attachments')
        .upload(`public/${userData.user.id}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      console.log('File uploaded successfully:', data);
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('note_attachments')
        .getPublicUrl(`public/${userData.user.id}/${fileName}`);
      
      console.log('File public URL:', urlData);
      
      // Update the note with the attachment URL
      const fileUrl = urlData.publicUrl;
      onAttachmentChange(fileUrl);
      setLocalAttachmentUrl(fileUrl);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please check your connection and try again.");
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = () => {
    // We're just removing the reference to the file, not deleting it from storage
    onAttachmentChange(null);
    setLocalAttachmentUrl(null);
    toast.success("Attachment removed");
  };

  // Determine file type from URL or extension
  const getFileType = (url: string): 'image' | 'document' => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension || '')) {
      return 'image';
    }
    return 'document';
  };
  
  // Extract filename from URL
  const getFileName = (url: string): string => {
    const pathParts = url.split('/');
    return pathParts[pathParts.length - 1] || 'attachment';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium">Attachments</h3>
      
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        onChange={handleUpload}
      />
      
      {!localAttachmentUrl ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
          <p className="text-muted-foreground mb-4">Upload a file to attach to this note</p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload File
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              {getFileType(localAttachmentUrl) === 'image' ? (
                <Image size={20} className="text-blue-500" />
              ) : (
                <FileText size={20} className="text-blue-500" />
              )}
              <span className="text-sm font-medium">
                {getFileName(localAttachmentUrl)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => window.open(localAttachmentUrl, '_blank')}
                title="Open file"
              >
                <ExternalLink size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleRemoveAttachment}
                title="Remove attachment"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
          
          {getFileType(localAttachmentUrl) === 'image' && (
            <div className="mt-2">
              <img 
                src={localAttachmentUrl} 
                alt="Attachment preview" 
                className="max-w-full rounded border" 
              />
            </div>
          )}
          
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Replace File
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentSection;
