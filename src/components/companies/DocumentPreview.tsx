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
        // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path
        const urlParts = document.file_url.split('/storage/v1/object/public/');
        if (urlParts.length < 2) {
          throw new Error('Invalid URL format');
        }
        
        const pathWithBucket = urlParts[1];
        const [bucket, ...pathParts] = pathWithBucket.split('/');
        const filePath = pathParts.join('/');
        
        // Download the file using authenticated Supabase client
        const { data, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath);
        
        if (downloadError) throw downloadError;
        
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
