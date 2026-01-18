import { useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfViewer } from "@/components/PdfViewer";
import { supabase } from "@/integrations/supabase/client";

interface DocumentPreviewProps {
  document: {
    file_url: string;
    name: string;
    mime_type: string | null;
  };
  onDownload: () => void;
}

export function DocumentPreview({ document, onDownload }: DocumentPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      setLoading(true);
      setError(false);
      
      try {
        // Extract the path from the file_url
        // Support both public and signed URL formats
        let bucket: string;
        let filePath: string;
        
        // Check for public URL format: /storage/v1/object/public/bucket-name/path
        const publicMatch = document.file_url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
        // Check for signed URL format: /storage/v1/object/sign/bucket-name/path
        const signedMatch = document.file_url.match(/\/storage\/v1\/object\/sign\/([^/]+)\/([^?]+)/);
        
        if (publicMatch) {
          bucket = publicMatch[1];
          // Don't decode - the path in URL might already be the correct storage path
          filePath = publicMatch[2];
        } else if (signedMatch) {
          bucket = signedMatch[1];
          filePath = signedMatch[2];
        } else {
          throw new Error('Invalid URL format');
        }
        
        console.log('Attempting to download:', { bucket, filePath, originalUrl: document.file_url });
        
        // Try to download directly first
        let { data, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath);
        
        // If download fails, try with decoded path
        if (downloadError && filePath.includes('%')) {
          console.log('Trying with decoded path...');
          const decodedPath = decodeURIComponent(filePath);
          const retryResult = await supabase.storage
            .from(bucket)
            .download(decodedPath);
          
          if (!retryResult.error) {
            data = retryResult.data;
            downloadError = null;
          }
        }
        
        // If direct download fails (private bucket), try with signed URL
        if (downloadError) {
          console.log('Direct download failed, trying signed URL...', downloadError.message);
          
          // Try both encoded and decoded paths for signed URL
          const pathsToTry = [filePath];
          if (filePath.includes('%')) {
            pathsToTry.push(decodeURIComponent(filePath));
          }
          
          let signedUrlSuccess = false;
          for (const pathToTry of pathsToTry) {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from(bucket)
              .createSignedUrl(pathToTry, 3600);
            
            if (!signedUrlError && signedUrlData) {
              const response = await fetch(signedUrlData.signedUrl);
              if (response.ok) {
                data = await response.blob();
                signedUrlSuccess = true;
                break;
              }
            }
          }
          
          if (!signedUrlSuccess) {
            throw new Error('Failed to generate signed URL');
          }
        }
        
        if (!data) throw new Error('No data received');
        
        // Create blob URL
        const url = URL.createObjectURL(data);
        setBlobUrl(url);
      } catch (err) {
        console.error('Error loading document:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [document.file_url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">A carregar documento...</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">
          Erro ao carregar documento. Tente descarregar.
        </p>
        <Button onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Descarregar
        </Button>
      </div>
    );
  }

  // Check if PDF by mime_type OR by file extension (fallback for missing mime_type)
  const isPdf = document.mime_type === "application/pdf" || 
                document.name?.toLowerCase().endsWith('.pdf') ||
                document.file_url?.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return (
      <PdfViewer 
        url={blobUrl} 
        filename={document.name}
      />
    );
  }

  // Check if image by mime_type OR by file extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const isImage = document.mime_type?.startsWith("image/") ||
                  imageExtensions.some(ext => document.name?.toLowerCase().endsWith(ext));

  if (isImage) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-end gap-2 p-4 border-b">
          <Button size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descarregar
          </Button>
        </div>
        <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
          <img 
            src={blobUrl} 
            alt={document.name}
            className="max-w-full max-h-full object-contain shadow-lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <FileText className="h-16 w-16 text-muted-foreground" />
      <p className="text-muted-foreground">
        Pré-visualização não disponível para este tipo de ficheiro
      </p>
      <Button onClick={onDownload}>
        <Download className="h-4 w-4 mr-2" />
        Descarregar
      </Button>
    </div>
  );
}
