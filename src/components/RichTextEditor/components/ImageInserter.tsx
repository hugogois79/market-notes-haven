
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Upload, Link } from 'lucide-react';

interface ImageInserterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageInsert: (url: string) => void;
}

const ImageInserter: React.FC<ImageInserterProps> = ({ open, onOpenChange, onImageInsert }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [isUploading, setIsUploading] = useState(false);

  const handleInsertImage = async () => {
    if (activeTab === 'url' && imageUrl) {
      onImageInsert(imageUrl);
      onOpenChange(false);
    } else if (activeTab === 'upload' && selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        onImageInsert(data.url);
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Add an image to your note by URL or upload
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
            <div className="flex gap-2">
              <Input
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1"
              />
            </div>
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
                Selected: {selectedFile.name}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
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
            {isUploading ? 'Uploading...' : 'Insert Image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageInserter;
