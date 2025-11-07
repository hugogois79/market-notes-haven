import { useState } from "react";
import { Download, ZoomIn, ZoomOut, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export const PdfViewer = ({ url, filename = "documento.pdf" }: PdfViewerProps) => {
  const [zoom, setZoom] = useState(100);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Erro ao carregar o PDF');
    setIsLoading(false);
  };

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
        <div className="flex items-center gap-4">
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
          
          {numPages > 0 && (
            <div className="flex items-center gap-2 border-l pl-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                {pageNumber} / {numPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <Button size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Descarregar
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="flex items-center justify-center min-h-full p-4">
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">A carregar PDF...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">
                  Não foi possível pré-visualizar o PDF
                </p>
                <p className="text-sm text-muted-foreground">
                  {error}
                </p>
              </div>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descarregar PDF
              </Button>
            </div>
          )}

          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className={isLoading || error ? "hidden" : ""}
          >
            <Page
              pageNumber={pageNumber}
              scale={zoom / 100}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>
    </div>
  );
};
