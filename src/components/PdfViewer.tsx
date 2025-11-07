import { useState, useEffect } from "react";
import { Download, Maximize2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export const PdfViewer = ({ url, filename = "documento.pdf" }: PdfViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Verify blob is accessible
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        console.log("PdfViewer: Blob loaded successfully, size:", blob.size);
        setLoading(false);
      })
      .catch(err => {
        console.error("PdfViewer: Error loading blob:", err);
        setError(true);
        setLoading(false);
      });
  }, [url]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFullscreen = async () => {
    try {
      // Convert blob to data URL for opening in new tab
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${filename}</title>
                <style>
                  body { margin: 0; padding: 0; }
                  embed { width: 100vw; height: 100vh; }
                </style>
              </head>
              <body>
                <embed src="${base64data}" type="application/pdf" />
              </body>
            </html>
          `);
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Error opening PDF in new tab:", err);
      // Fallback to direct blob URL
      window.open(url, '_blank');
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

  if (error) {
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
        <object
          data={url}
          type="application/pdf"
          className="w-full h-full"
        >
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">
                Não foi possível pré-visualizar o PDF
              </p>
              <p className="text-sm text-muted-foreground">
                O seu navegador não suporta visualização de PDFs incorporados.
              </p>
            </div>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descarregar PDF
            </Button>
          </div>
        </object>
      </div>
    </div>
  );
};
