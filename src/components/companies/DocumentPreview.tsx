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
  editable?: boolean;
  onSave?: (modifiedPdf: Blob) => Promise<void>;
}

export function DocumentPreview({ document, onDownload, editable, onSave }: DocumentPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      setLoading(true);
      setError(false);
      
      try {
        console.log('Loading document from URL:', document.file_url);
        
        // First, try to fetch directly from the public URL
        // This works for public buckets without needing Supabase SDK
        try {
          const directResponse = await fetch(document.file_url);
          if (directResponse.ok) {
            const data = await directResponse.blob();
            const url = URL.createObjectURL(data);
            setBlobUrl(url);
            setLoading(false);
            return;
          }
          console.log('Direct fetch failed with status:', directResponse.status);
        } catch (fetchErr) {
          console.log('Direct fetch failed:', fetchErr);
        }
        
        // If direct fetch fails, try Supabase Storage SDK
        // Extract the path from the file_url
        let bucket: string;
        let filePath: string;
        
        // Check for public URL format: /storage/v1/object/public/bucket-name/path
        const publicMatch = document.file_url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
        // Check for signed URL format: /storage/v1/object/sign/bucket-name/path
        const signedMatch = document.file_url.match(/\/storage\/v1\/object\/sign\/([^/]+)\/([^?]+)/);
        
        if (publicMatch) {
          bucket = publicMatch[1];
          filePath = publicMatch[2];
        } else if (signedMatch) {
          bucket = signedMatch[1];
          filePath = signedMatch[2];
        } else {
          throw new Error('Invalid URL format');
        }
        
        console.log('Trying Supabase SDK:', { bucket, filePath });
        
        // Try paths: original, decoded, and double-decoded
        const pathsToTry = [filePath];
        if (filePath.includes('%')) {
          pathsToTry.push(decodeURIComponent(filePath));
          // Double decode for cases like %2528 -> %28 -> (
          try {
            const doubleDecoded = decodeURIComponent(decodeURIComponent(filePath));
            if (!pathsToTry.includes(doubleDecoded)) {
              pathsToTry.push(doubleDecoded);
            }
          } catch { /* ignore decode errors */ }
        }
        
        let data: Blob | null = null;
        
        // Try download with each path
        for (const pathToTry of pathsToTry) {
          console.log('Trying download path:', pathToTry);
          const { data: downloadData, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(pathToTry);
          
          if (!downloadError && downloadData) {
            data = downloadData;
            console.log('Download succeeded with path:', pathToTry);
            break;
          } else {
            console.log('Download failed:', downloadError?.message);
          }
        }
        
        // If download still fails, try signed URL
        if (!data) {
          console.log('Trying signed URLs...');
          for (const pathToTry of pathsToTry) {
            console.log('Trying signed URL for path:', pathToTry);
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from(bucket)
              .createSignedUrl(pathToTry, 3600);
            
            if (signedUrlError) {
              console.log('Signed URL error:', signedUrlError.message);
              continue;
            }
            
            if (signedUrlData) {
              console.log('Got signed URL, fetching...');
              const response = await fetch(signedUrlData.signedUrl);
              if (response.ok) {
                data = await response.blob();
                console.log('Signed URL fetch succeeded');
                break;
              }
              console.log('Signed URL fetch failed with status:', response.status);
            }
          }
        }
        
        if (!data) {
          throw new Error('All download methods failed');
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
        editable={editable}
        onSave={onSave}
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
