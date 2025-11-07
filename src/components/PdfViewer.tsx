import { useState } from "react";
import { Download, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export const PdfViewer = ({ url, filename = "documento.pdf" }: PdfViewerProps) => {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-background/50">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Descarregar
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto bg-muted/20">
        <div 
          className="flex items-center justify-center min-h-full p-4"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <object
            data={url}
            type="application/pdf"
            className="w-full h-[800px] bg-background shadow-lg"
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
    </div>
  );
};
