
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Upload } from 'lucide-react';

interface UploadButtonProps {
  isUploading: boolean;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const UploadButton: React.FC<UploadButtonProps> = ({ 
  isUploading, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <Button
      variant={variant === 'primary' ? 'outline' : 'outline'}
      onClick={onClick}
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
          {variant === 'primary' ? (
            <Upload size={16} />
          ) : (
            <Plus size={16} />
          )}
          {variant === 'primary' ? 'Upload Files' : 'Add More Files'}
        </>
      )}
    </Button>
  );
};

export default UploadButton;
