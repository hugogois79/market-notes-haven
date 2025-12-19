import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";

// pdf.js worker (Vite-friendly)
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export const PdfViewer = ({ url, filename = "documento.pdf" }: PdfViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.25);

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
      if (!pdf) throw new Error("PDF ainda a carregar");

      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Pop-up bloqueado");

      const images: string[] = [];
      const printScale = 2;

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

      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Imprimir PDF</title>
  <style>
    @page { margin: 10mm; }
    body { margin: 0; background: white; }
    img { width: 100%; page-break-after: always; display: block; }
    img:last-child { page-break-after: auto; }
  </style>
</head>
<body>
  ${images.map((src) => `<img src="${src}" alt="Página" />`).join("\n")}
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
      // fallback
      window.open(url, "_blank");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setNumPages(0);
      setPageNumber(1);

      try {
        const task = getDocument(url);
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
    </div>
  );
};
