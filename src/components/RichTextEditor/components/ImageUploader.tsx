
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useImageUpload } from '../hooks/editor/useImageUpload';
import { toast } from 'sonner';

interface ImageUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageInsert: (url: string) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

const ImageUploader: React.FC<ImageUploaderProps> = ({ open, onOpenChange, onImageInsert }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');

  const { uploadImage, isUploading, error } = useImageUpload({
    onSuccess: (url) => {
      onImageInsert(url);
      onOpenChange(false);
    },
  });

  const handleInsertImage = async () => {
    if (activeTab === 'url' && imageUrl) {
      onImageInsert(imageUrl);
      onOpenChange(false);
    } else if (activeTab === 'upload' && selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('File size exceeds 50MB limit');
        return;
      }
      
      try {
        const url = await uploadImage(selectedFile);
        onImageInsert(url);
        onOpenChange(false);
      } catch (err) {
        console.error('Failed to upload image:', err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size exceeds 50MB limit');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setImageUrl('');
        setSelectedFile(null);
      }, 300); // Wait for dialog animation to complete
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Add an image to your note (max 50MB)
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'url' | 'upload')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">Image URL</TabsTrigger>
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="py-4">
            <Input
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full"
            />
          </TabsContent>
          
          <TabsContent value="upload" className="py-4">
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="w-full"
            />
            {selectedFile && (
              <div className="mt-2 text-sm text-gray-500">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
              </div>
            )}
            {error && (
              <div className="mt-2 text-sm text-red-500">
                Error: {error.message}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleInsertImage} 
            disabled={
              (activeTab === 'url' && !imageUrl) || 
              (activeTab === 'upload' && !selectedFile) || 
              isUploading
            }
          >
            {isUploading ? "Uploading..." : "Insert Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploader;
