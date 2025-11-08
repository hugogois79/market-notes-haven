import { useState } from "react";
import { Download, Maximize2, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export const PdfViewer = ({ url, filename = "documento.pdf" }: PdfViewerProps) => {
  const [error, setError] = useState(false);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.open(url, '_blank')?.print();
  };

  const handleFullscreen = () => {
    window.open(url, '_blank');
  };

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
        <embed
          src={url}
          type="application/pdf"
          className="w-full h-full"
          title={filename}
        />
      </div>
    </div>
  );
};
