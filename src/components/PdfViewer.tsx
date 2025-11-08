import { useState, useEffect } from "react";
import { Download, Maximize2, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export const PdfViewer = ({ url, filename = "documento.pdf" }: PdfViewerProps) => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const loadPdf = async () => {
      try {
        console.log("PdfViewer: Loading PDF from URL:", url);
        const response = await fetch(url);
        const blob = await response.blob();
        console.log("PdfViewer: Blob loaded successfully, size:", blob.size, "type:", blob.type);
        
        // Convert blob to data URL for reliable rendering
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          console.log("PdfViewer: Data URL created, length:", dataUrl.length);
          setPdfDataUrl(dataUrl);
          setLoading(false);
        };
        reader.onerror = () => {
          console.error("PdfViewer: Error reading blob");
          setError(true);
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("PdfViewer: Error loading blob:", err);
        setError(true);
        setLoading(false);
      }
    };
    
    loadPdf();
  }, [url]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!pdfDataUrl) return;
    
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
    
    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 100);
      }, 250);
    };
    
    printFrame.src = pdfDataUrl;
  };

  const handleFullscreen = () => {
    if (!pdfDataUrl) return;
    
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body { margin: 0; padding: 0; overflow: hidden; }
              iframe { width: 100vw; height: 100vh; border: none; }
            </style>
          </head>
          <body>
            <iframe src="${pdfDataUrl}" type="application/pdf"></iframe>
          </body>
        </html>
      `);
      newWindow.document.close();
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
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
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
        {pdfDataUrl && (
          <iframe
            src={pdfDataUrl}
            className="w-full h-full border-0"
            title={filename}
          />
        )}
      </div>
    </div>
  );
};
