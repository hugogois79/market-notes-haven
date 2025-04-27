
import React from 'react';
import FilePreview from './FilePreview';
import UploadButton from './UploadButton';

interface FileListProps {
  attachments: string[];
  isUploading: boolean;
  onRemoveAttachment: (url: string) => void;
  onUploadClick: () => void;
}

const FileList: React.FC<FileListProps> = ({
  attachments,
  isUploading,
  onRemoveAttachment,
  onUploadClick,
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="space-y-2">
        {attachments.map((url, index) => (
          <FilePreview
            key={`${index}-${url.substring(url.lastIndexOf('/') + 1)}`}
            url={url}
            onRemove={() => onRemoveAttachment(url)}
          />
        ))}
      </div>
      
      <div className="mt-4 flex justify-center">
        <UploadButton 
          isUploading={isUploading} 
          onClick={onUploadClick}
          variant="secondary"
        />
      </div>
    </div>
  );
};

export default FileList;
