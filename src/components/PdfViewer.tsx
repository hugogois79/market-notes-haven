import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Printer,
  Trash2,
  Plus,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { DeletePageDialog } from "@/components/pdf/DeletePageDialog";
import { AddPageDialog } from "@/components/pdf/AddPageDialog";
import { deletePageFromPdf, addPagesToDocument } from "@/utils/pdfPageManipulation";

// pdf.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfViewerProps {
  url: string;
  filename?: string;
  editable?: boolean;
  onSave?: (modifiedPdf: Blob) => Promise<void>;
}

export const PdfViewer = ({ 
  url, 
  filename = "documento.pdf",
  editable = false,
  onSave,
}: PdfViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const originalBytesRef = useRef<ArrayBuffer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.25);
  
  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedPdfBytes, setModifiedPdfBytes] = useState<ArrayBuffer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const downloadAsBlob = async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha ao descarregar o PDF");
    return await res.blob();
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadAsBlob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch {
      // fallback
      window.open(url, "_blank");
    }
  };

  const handlePrint = async () => {
    try {
      // Print without opening blob URLs (can be blocked by browser extensions)
      const pdf = pdfRef.current;
      if (!pdf || loading) {
        toast.error("PDF ainda a carregar, aguarde um momento");
        return;
      }

      const images: string[] = [];
      const printScale = 2;

      // Render all pages to images first
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: printScale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas indisponível");

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        images.push(canvas.toDataURL("image/png"));
      }

      // Only open window after we have all images ready
      if (images.length === 0) {
        toast.error("Não foi possível preparar o documento para impressão");
        return;
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Pop-up bloqueado pelo navegador");
        return;
      }

      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title></title>
  <style>
    @page { 
      margin: 5mm; 
      size: auto;
    }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    body { margin: 0; padding: 0; background: white; }
    img { width: 100%; page-break-after: always; display: block; margin: 0; padding: 0; }
    img:last-child { page-break-after: auto; }
  </style>
</head>
<body>
  ${images.map((src) => `<img src="${src}" alt="" />`).join("\n")}
  <script>
    window.onload = () => {
      window.focus();
      window.print();
      setTimeout(() => window.close(), 250);
    };
  </script>
</body>
</html>`);
      printWindow.document.close();
    } catch (e) {
      console.error("Print failed:", e);
      toast.error("Erro ao imprimir: " + (e instanceof Error ? e.message : "erro desconhecido"));
    }
  };

  // Get current PDF bytes (modified or from URL)
  const getCurrentPdfBytes = useCallback(async (): Promise<ArrayBuffer> => {
    if (modifiedPdfBytes) {
      return modifiedPdfBytes;
    }
    if (originalBytesRef.current) {
      return originalBytesRef.current;
    }
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    originalBytesRef.current = bytes;
    return bytes;
  }, [url, modifiedPdfBytes]);

  // Handle delete page
  const handleDeletePage = useCallback(async () => {
    setIsDeleting(true);
    try {
      const currentBytes = await getCurrentPdfBytes();
      const newBytes = await deletePageFromPdf(currentBytes, pageNumber - 1);
      
      setModifiedPdfBytes(newBytes);
      setIsEditing(true);
      setShowDeleteDialog(false);
      
      // Reload PDF from new bytes
      const pdf = await pdfjs.getDocument({ data: newBytes }).promise;
      
      // Cleanup old ref
      try { pdfRef.current?.destroy(); } catch { /* ignore */ }
      
      pdfRef.current = pdf;
      setNumPages(pdf.numPages);
      
      // Adjust page number if we deleted the last page
      if (pageNumber > pdf.numPages) {
        setPageNumber(pdf.numPages);
      }
      
      toast.success("Página eliminada. Clique em Guardar para aplicar as alterações.");
    } catch (err) {
      console.error("Error deleting page:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar página");
    } finally {
      setIsDeleting(false);
    }
  }, [getCurrentPdfBytes, pageNumber]);

  // Handle add pages
  const handleAddPages = useCallback(async (
    file: File, 
    pageIndices: number[], 
    insertBefore: boolean
  ) => {
    setIsAdding(true);
    try {
      const currentBytes = await getCurrentPdfBytes();
      const sourceBytes = await file.arrayBuffer();
      
      // Calculate insert position
      const insertAfterIndex = insertBefore ? pageNumber - 2 : pageNumber - 1;
      
      const newBytes = await addPagesToDocument(
        currentBytes,
        sourceBytes,
        pageIndices,
        insertAfterIndex
      );
      
      setModifiedPdfBytes(newBytes);
      setIsEditing(true);
      setShowAddDialog(false);
      
      // Reload PDF from new bytes
      const pdf = await pdfjs.getDocument({ data: newBytes }).promise;
      
      // Cleanup old ref
      try { pdfRef.current?.destroy(); } catch { /* ignore */ }
      
      pdfRef.current = pdf;
      setNumPages(pdf.numPages);
      
      toast.success(`${pageIndices.length} página(s) adicionada(s). Clique em Guardar para aplicar as alterações.`);
    } catch (err) {
      console.error("Error adding pages:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar páginas");
    } finally {
      setIsAdding(false);
    }
  }, [getCurrentPdfBytes, pageNumber]);

  // Handle save changes
  const handleSaveChanges = useCallback(async () => {
    if (!modifiedPdfBytes || !onSave) return;
    
    setIsSaving(true);
    try {
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      await onSave(blob);
      
      // Reset editing state after successful save
      setIsEditing(false);
      originalBytesRef.current = modifiedPdfBytes;
      setModifiedPdfBytes(null);
      
      toast.success("Documento guardado com sucesso!");
    } catch (err) {
      console.error("Error saving PDF:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao guardar documento");
    } finally {
      setIsSaving(false);
    }
  }, [modifiedPdfBytes, onSave]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setNumPages(0);
      setPageNumber(1);
      setIsEditing(false);
      setModifiedPdfBytes(null);
      originalBytesRef.current = null;

      try {
        const task = pdfjs.getDocument(url);
        const pdf = await task.promise;
        if (cancelled) return;

        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setLoading(false);
        setError(e instanceof Error ? e.message : "Não foi possível carregar o PDF");
      }
    };

    load();

    return () => {
      cancelled = true;
      try {
        renderTaskRef.current?.cancel?.();
      } catch {
        // ignore
      }
      renderTaskRef.current = null;

      try {
        pdfRef.current?.destroy();
      } catch {
        // ignore
      }
      pdfRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    const render = async () => {
      const pdf = pdfRef.current;
      const canvas = canvasRef.current;
      if (!pdf || !canvas) return;

      try {
        renderTaskRef.current?.cancel?.();
      } catch {
        // ignore
      }

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // HiDPI
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
      // pdfjs renderTask has cancel()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderTaskRef.current = renderTask as any;
      await renderTask.promise;
    };

    if (!loading && !error) render();
  }, [pageNumber, scale, loading, error]);

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-8">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Erro ao carregar PDF</p>
          <p className="text-sm text-muted-foreground">
            {error || "Não foi possível carregar o ficheiro. Tente descarregar."}
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
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={loading || pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground min-w-[110px] text-center">
            {numPages > 0 ? `Página ${pageNumber} / ${numPages}` : ""}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPageNumber((p) => Math.min(numPages || p + 1, p + 1))}
            disabled={loading || (numPages > 0 ? pageNumber >= numPages : true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button
            size="sm"
            variant="outline"
            onClick={() => setScale((s) => Math.max(0.75, Number((s - 0.25).toFixed(2))))}
            disabled={loading}
          >
            -
          </Button>
          <div className="text-sm text-muted-foreground w-14 text-center">
            {Math.round(scale * 100)}%
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setScale((s) => Math.min(3, Number((s + 0.25).toFixed(2))))}
            disabled={loading}
          >
            +
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {editable && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading || numPages <= 1 || isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddDialog(true)}
                disabled={loading || isAdding}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
              
              {isEditing && onSave && (
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Guardar
                </Button>
              )}
              
              <div className="w-px h-6 bg-border mx-1" />
            </>
          )}
          
          <Button size="sm" variant="outline" onClick={handlePrint} disabled={loading}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Descarregar
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="min-h-full flex items-start justify-center p-6">
          <div className={cn("relative", loading && "opacity-60")}> 
            <canvas ref={canvasRef} className="shadow-sm rounded-md bg-background" />
            {loading && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A carregar PDF...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DeletePageDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        pageNumber={pageNumber}
        totalPages={numPages}
        onConfirm={handleDeletePage}
        isDeleting={isDeleting}
      />
      
      <AddPageDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        currentPage={pageNumber}
        totalPages={numPages}
        onConfirm={handleAddPages}
        isAdding={isAdding}
      />
    </div>
  );
};
