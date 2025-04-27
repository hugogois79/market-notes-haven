
import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import EmptyState from './Attachments/EmptyState';
import FileList from './Attachments/FileList';

interface AttachmentSectionProps {
  noteId: string;
  attachmentUrl?: string | null;
  attachments?: string[];
  onAttachmentChange: (url: string | null) => void;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  noteId,
  attachmentUrl,
  attachments: initialAttachments = [],
  onAttachmentChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize attachments state from props
  useEffect(() => {
    // Convert to array if single string or use initialAttachments
    if (initialAttachments && initialAttachments.length > 0) {
      setAttachments(initialAttachments);
    } else if (attachmentUrl) {
      setAttachments([attachmentUrl]);
    } else {
      setAttachments([]);
    }
  }, [initialAttachments, attachmentUrl]);

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
        
        // Create safe filename
        const fileExt = file.name.split('.').pop();
        const baseFileName = file.name.replace(/\.[^/.]+$/, '');
        const safeFileName = `${baseFileName.replace(/[^\w-]/g, '_')}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('User not authenticated');
        }
        
        const { data, error } = await supabase.storage
          .from('note_attachments')
          .upload(`public/${userData.user.id}/${safeFileName}`, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('note_attachments')
          .getPublicUrl(`public/${userData.user.id}/${safeFileName}`);
        
        uploadedUrls.push(urlData.publicUrl);
      }
      
      if (uploadedUrls.length > 0) {
        // Combine existing attachments with new ones
        const updatedAttachments = [...attachments, ...uploadedUrls];
        setAttachments(updatedAttachments);
        
        // Send all attachments as a JSON string to parent
        onAttachmentChange(JSON.stringify(updatedAttachments));
        
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
    // Filter out the removed attachment
    const updatedAttachments = attachments.filter(url => url !== urlToRemove);
    setAttachments(updatedAttachments);
    
    // Send updated attachments list to parent or null if empty
    if (updatedAttachments.length > 0) {
      onAttachmentChange(JSON.stringify(updatedAttachments));
    } else {
      onAttachmentChange(null);
    }
    
    toast.success("Attachment removed");
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
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
        <EmptyState
          isUploading={isUploading}
          onUploadClick={triggerFileUpload}
        />
      ) : (
        <FileList
          attachments={attachments}
          isUploading={isUploading}
          onRemoveAttachment={handleRemoveAttachment}
          onUploadClick={triggerFileUpload}
        />
      )}
    </div>
  );
};

export default AttachmentSection;
