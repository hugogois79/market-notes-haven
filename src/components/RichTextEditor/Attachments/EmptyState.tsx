
import React from 'react';
import UploadButton from './UploadButton';

interface EmptyStateProps {
  isUploading: boolean;
  onUploadClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isUploading, onUploadClick }) => {
  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
      <p className="text-muted-foreground mb-4">Upload files to attach to this note</p>
      <UploadButton 
        isUploading={isUploading} 
        onClick={onUploadClick}
        variant="primary"
      />
    </div>
  );
};

export default EmptyState;
