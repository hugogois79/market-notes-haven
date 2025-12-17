import { useState } from "react";
import { Download, FileText, Printer, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker - use legacy build for better compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export const PdfViewer = ({ url, filename = "documento.pdf" }: PdfViewerProps) => {
  const [error, setError] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    // Use browser's native download to allow user to print from their PDF viewer
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setError(false);
  };

  const onDocumentLoadError = () => {
    setError(true);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
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
          {numPages > 0 && `Página ${pageNumber} de ${numPages}`}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descarregar
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-muted/20 flex flex-col items-center py-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">A carregar PDF...</div>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
            loading={
              <div className="flex items-center justify-center p-8 min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          />
        </Document>
        
        {numPages > 1 && (
          <div className="flex items-center gap-4 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={previousPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {pageNumber} / {numPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={nextPage}
              disabled={pageNumber >= numPages}
            >
              Seguinte
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
