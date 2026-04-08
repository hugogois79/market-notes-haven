import { useState, useEffect, useRef } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfViewer } from "@/components/PdfViewer";
import { supabase } from "@/integrations/supabase/client";
import { parseSupabaseStorageLooseRef } from "@/hooks/useFileServerBaseUrl";
import { filterPdfBlob } from "@/utils/pdfBlob";

interface DocumentPreviewProps {
  document: {
    file_url: string;
    name: string;
    mime_type: string | null;
  };
  onDownload: () => void;
  editable?: boolean;
  onSave?: (modifiedPdf: Blob) => Promise<void>;
  /** Fallback quando fetch directo / Supabase falha (ex.: mesmo fluxo que handleDownload). */
  getBlob?: () => Promise<Blob | null>;
}

function resolveFetchUrl(url: string): string {
  const u = url.trim();
  if (!u) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (typeof window !== "undefined") {
    return new URL(u, window.location.origin).href;
  }
  return u;
}

export function DocumentPreview({ document, onDownload, editable, onSave, getBlob }: DocumentPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const setBlobFromData = (data: Blob) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const u = URL.createObjectURL(data);
    objectUrlRef.current = u;
    setBlobUrl(u);
  };

  useEffect(() => {
    const fetchFile = async () => {
      setLoading(true);
      setError(false);
      setBlobUrl(null);

      const isPdfDocument =
        document.mime_type === "application/pdf" ||
        document.name?.toLowerCase().endsWith(".pdf") ||
        document.file_url?.toLowerCase().includes(".pdf");

      /** Para PDFs, rejeita HTML/SPA devolvido com 200; imagens passam sem filtro mágico. */
      const acceptBlob = async (raw: Blob | null): Promise<boolean> => {
        if (!raw || raw.size === 0) return false;
        if (isPdfDocument) {
          const pdf = await filterPdfBlob(raw);
          if (pdf) {
            setBlobFromData(pdf);
            return true;
          }
          return false;
        }
        setBlobFromData(raw);
        return true;
      };

      try {
        // 1) Pipeline do parent (WorkFlow: Supabase SDK antes de /api/work-files)
        if (getBlob) {
          try {
            const fromParent = await getBlob();
            if (await acceptBlob(fromParent)) return;
          } catch (e) {
            console.warn("DocumentPreview getBlob:", e);
          }
        }

        // 2) Supabase SDK + signed URL (antes de fetch: evita CORS e HTML da SPA em /storage)
        const parsed = parseSupabaseStorageLooseRef(document.file_url);
        if (parsed) {
          const pathsToTry = [parsed.filePath];
          if (parsed.filePath.includes("%")) {
            pathsToTry.push(decodeURIComponent(parsed.filePath));
            try {
              const doubleDecoded = decodeURIComponent(decodeURIComponent(parsed.filePath));
              if (!pathsToTry.includes(doubleDecoded)) pathsToTry.push(doubleDecoded);
            } catch {
              /* ignore */
            }
          }

          let data: Blob | null = null;
          for (const pathToTry of pathsToTry) {
            const { data: downloadData, error: downloadError } = await supabase.storage
              .from(parsed.bucket)
              .download(pathToTry);

            if (!downloadError && downloadData) {
              data = downloadData;
              break;
            }
          }

          if (!data) {
            for (const pathToTry of pathsToTry) {
              const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from(parsed.bucket)
                .createSignedUrl(pathToTry, 3600);

              if (signedUrlError || !signedUrlData) continue;

              const response = await fetch(signedUrlData.signedUrl);
              if (response.ok) {
                data = await response.blob();
                break;
              }
            }
          }

          if (data && (await acceptBlob(data))) return;
        }

        // 3) Fetch directo (público, /api/work-files — último recurso)
        const fetchUrl = resolveFetchUrl(document.file_url);
        if (fetchUrl) {
          try {
            const credentials = fetchUrl.includes("/api/") ? "include" : "same-origin";
            const directResponse = await fetch(fetchUrl, { credentials });
            if (directResponse.ok) {
              const ct = (directResponse.headers.get("content-type") || "").toLowerCase();
              if (!isPdfDocument || (!ct.includes("text/html") && !ct.includes("application/json"))) {
                const blobData = await directResponse.blob();
                if (await acceptBlob(blobData)) return;
              }
            }
            console.log("DocumentPreview direct fetch not ok or empty:", directResponse.status);
          } catch (fetchErr) {
            console.log("DocumentPreview direct fetch failed:", fetchErr);
          }
        }

        setError(true);
      } catch (err) {
        console.error("Error loading document:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [document.file_url, document.mime_type, document.name, getBlob]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">A carregar documento...</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">
          Erro ao carregar documento. Tente descarregar.
        </p>
        <Button onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Descarregar
        </Button>
      </div>
    );
  }

  // Check if PDF by mime_type OR by file extension (fallback for missing mime_type)
  const isPdf = document.mime_type === "application/pdf" ||
    document.name?.toLowerCase().endsWith(".pdf") ||
    document.file_url?.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return (
      <PdfViewer
        url={blobUrl}
        filename={document.name}
        editable={editable}
        onSave={onSave}
      />
    );
  }

  // Check if image by mime_type OR by file extension
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  const isImage =
    document.mime_type?.startsWith("image/") ||
    imageExtensions.some((ext) => document.name?.toLowerCase().endsWith(ext));

  if (isImage) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-end gap-2 p-4 border-b">
          <Button size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descarregar
          </Button>
        </div>
        <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
          <img
            src={blobUrl}
            alt={document.name}
            className="max-w-full max-h-full object-contain shadow-lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <FileText className="h-16 w-16 text-muted-foreground" />
      <p className="text-muted-foreground">
        Pré-visualização não disponível para este tipo de ficheiro
      </p>
      <Button onClick={onDownload}>
        <Download className="h-4 w-4 mr-2" />
        Descarregar
      </Button>
    </div>
  );
}
