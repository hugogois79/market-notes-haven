
import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Image, Trash2 } from 'lucide-react';

interface FilePreviewProps {
  url: string;
  onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ url, onRemove }) => {
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

  const fileType = getFileType(url);
  const fileName = getFileName(url);

  return (
    <div className="border rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {fileType === 'image' ? (
            <Image size={20} className="text-blue-500" />
          ) : (
            <FileText size={20} className="text-blue-500" />
          )}
          <span className="text-sm font-medium truncate max-w-[180px]">
            {fileName}
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
            onClick={onRemove}
            title="Remove attachment"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
      
      {fileType === 'image' && (
        <div className="mt-2">
          <img 
            src={url} 
            alt="Attachment preview" 
            className="max-w-full rounded border" 
          />
        </div>
      )}
    </div>
  );
};

export default FilePreview;
