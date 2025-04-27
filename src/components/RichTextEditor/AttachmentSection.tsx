import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ExternalLink, Image, FileText, Loader2, Plus, FileIcon } from 'lucide-react';
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
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (attachmentUrl) {
      setAttachments(attachmentUrl ? [attachmentUrl] : []);
    } else {
      setAttachments([]);
    }
  }, [attachmentUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${noteId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        console.log('Uploading file to Supabase storage...', fileName);
        
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('User not authenticated');
        }
        
        const { data, error } = await supabase.storage
          .from('note_attachments')
          .upload(`public/${userData.user.id}/${fileName}`, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }
        
        console.log('File uploaded successfully:', data);
        
        const { data: urlData } = supabase.storage
          .from('note_attachments')
          .getPublicUrl(`public/${userData.user.id}/${fileName}`);
        
        console.log('File public URL:', urlData);
        
        uploadedUrls.push(urlData.publicUrl);
      }
      
      if (uploadedUrls.length > 0) {
        const updatedAttachments = [...attachments, ...uploadedUrls];
        setAttachments(updatedAttachments);
        
        onAttachmentChange(updatedAttachments[0]);
        
        toast.success(`${uploadedUrls.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please check your connection and try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (urlToRemove: string) => {
    const updatedAttachments = attachments.filter(url => url !== urlToRemove);
    setAttachments(updatedAttachments);
    
    onAttachmentChange(updatedAttachments.length > 0 ? updatedAttachments[0] : null);
    
    toast.success("Attachment removed");
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getFileType = (url: string): 'image' | 'document' => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension || '')) {
      return 'image';
    }
    return 'document';
  };

  const getFileName = (url: string): string => {
    try {
      const urlWithoutParams = url.split('?')[0];
      const parts = urlWithoutParams.split('/');
      const lastPart = parts[parts.length - 1];
      return decodeURIComponent(lastPart);
    } catch (error) {
      console.error("Error extracting filename:", error);
      return "attachment";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium">Attachments</h3>
      
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        onChange={handleUpload}
        multiple
      />
      
      {attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
          <p className="text-muted-foreground mb-4">Upload files to attach to this note</p>
          <Button
            variant="outline"
            onClick={triggerFileUpload}
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
                Upload Files
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="space-y-2">
            {attachments.map((url, index) => (
              <div key={`${url}-${index}`} className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {getFileType(url) === 'image' ? (
                      <Image size={20} className="text-blue-500" />
                    ) : (
                      <FileText size={20} className="text-blue-500" />
                    )}
                    <span className="text-sm font-medium truncate max-w-[180px]">
                      {getFileName(url)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(url, '_blank')}
                      title="Open file"
                    >
                      <ExternalLink size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveAttachment(url)}
                      title="Remove attachment"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                
                {getFileType(url) === 'image' && (
                  <div className="mt-2">
                    <img 
                      src={url} 
                      alt="Attachment preview" 
                      className="max-w-full rounded border" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={triggerFileUpload}
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
                  <Plus size={16} />
                  Add More Files
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
