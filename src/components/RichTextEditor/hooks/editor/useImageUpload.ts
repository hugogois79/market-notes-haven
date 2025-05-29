
import { useState } from 'react';

interface UseImageUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

export const useImageUpload = (options?: UseImageUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    if (!file) {
      const error = new Error('No file selected');
      setError(error);
      options?.onError?.(error);
      return Promise.reject(error);
    }

    if (file.size > MAX_FILE_SIZE) {
      const error = new Error('File size exceeds 50MB limit');
      setError(error);
      options?.onError?.(error);
      return Promise.reject(error);
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create unique filename with timestamp
      const timestamp = new Date().getTime();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const fileName = `${timestamp}-${safeFileName}`;
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // If we get a URL back, return it
      if (data.url) {
        options?.onSuccess?.(data.url);
        return data.url;
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      const error = err instanceof Error ? err : new Error('Unknown upload error');
      setError(error);
      options?.onError?.(error);
      
      // Create a fallback data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            resolve(e.target.result);
          } else {
            reject(new Error('Failed to create data URL'));
          }
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
    error,
  };
};
