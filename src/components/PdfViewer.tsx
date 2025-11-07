import { useState } from "react";
import { Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export const PdfViewer = ({ url, filename = "documento.pdf" }: PdfViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleFullscreen = () => {
    window.open(url, '_blank');
  };

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
        <iframe
          src={url}
          className="w-full h-full border-0"
          title="PDF Viewer"
        />
      </div>
    </div>
  );
};
