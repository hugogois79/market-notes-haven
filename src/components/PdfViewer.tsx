import { useState, useEffect } from "react";
import { Download, Maximize2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export const PdfViewer = ({ url, filename = "documento.pdf" }: PdfViewerProps) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const convertBlobToDataUrl = async () => {
      try {
        console.log("PdfViewer: Converting blob to data URL...");
        const response = await fetch(url);
        const blob = await response.blob();
        console.log("PdfViewer: Blob received, size:", blob.size, "type:", blob.type);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          console.log("PdfViewer: Data URL created, length:", result.length);
          setDataUrl(result);
          setLoading(false);
        };
        reader.onerror = () => {
          console.error("PdfViewer: FileReader error");
          setError(true);
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("PdfViewer: Error converting blob:", err);
        setError(true);
        setLoading(false);
      }
    };

    convertBlobToDataUrl();
  }, [url]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleFullscreen = () => {
    if (dataUrl) {
      window.open(dataUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">A carregar PDF...</p>
      </div>
    );
  }

  if (error || !dataUrl) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-8">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">
            Erro ao carregar PDF
          </p>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o ficheiro. Tente descarregar.
          </p>
        </div>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Descarregar PDF
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-background/50">
        <div className="text-sm text-muted-foreground">
          Visualização de PDF
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Abrir em nova aba
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descarregar
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden bg-muted/20">
        <embed
          src={dataUrl}
          type="application/pdf"
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
