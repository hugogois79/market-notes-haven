import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getWorkFilesListUrl } from "@/hooks/useFileServerBaseUrl";
import { ArrowLeft, ChevronRight, Folder, Loader2 } from "lucide-react";

interface ListResponse {
  folder: string;
  parentFolder: string | null;
  items: { name: string; type: string }[];
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Base da API (vazio = mesmo origin). */
  baseUrl: string;
  /** Caminho relativo a WORK_FILES_ROOT ao abrir (ex.: Splendidoption (PT)/Work). */
  initialRelativePath: string;
  /** Começar dentro desta subpasta (ex. env), opcional. */
  startInsideFolder?: string;
  onConfirm: (relativePath: string | null) => void;
};

function normalizeConfirmFolder(apiFolder: string | undefined): string | null {
  if (apiFolder == null || apiFolder === "" || apiFolder === ".") return null;
  return apiFolder;
}

export function ServerFolderPickerDialog({
  open,
  onOpenChange,
  baseUrl,
  initialRelativePath,
  startInsideFolder = "",
  onConfirm,
}: Props) {
  const [currentFolder, setCurrentFolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    const seed = (initialRelativePath || startInsideFolder || "").trim();
    setCurrentFolder(seed);
    setError(null);
  }, [open, initialRelativePath, startInsideFolder]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = getWorkFilesListUrl(baseUrl, currentFolder);
        const res = await fetch(url);
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
        }
        if (!cancelled) setData(j as ListResponse);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Falha ao listar pastas");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, baseUrl, currentFolder]);

  const dirs = (data?.items || [])
    .filter((i) => i.type === "dir")
    .sort((a, b) => a.name.localeCompare(b.name));

  const canGoUp = data != null && data.parentFolder != null;

  const goUp = () => {
    if (!data) return;
    const p = data.parentFolder;
    if (p == null) return;
    setCurrentFolder(p === "." ? "" : p);
  };

  const enterDir = (name: string) => {
    const next = currentFolder ? `${currentFolder}/${name}` : name;
    setCurrentFolder(next);
  };

  const displayPath =
    data?.folder && data.folder !== "." ? data.folder : "(raiz — WORK_FILES_ROOT)";

  const handleConfirm = () => {
    onConfirm(normalizeConfirmFolder(data?.folder));
    onOpenChange(false);
  };

  const handleClear = () => {
    onConfirm(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pasta no servidor</DialogTitle>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            Navega pelas subpastas relativas à raiz configurada no VPS (<code className="text-[11px]">WORK_FILES_ROOT</code>).
            Confirma na pasta que queres usar como prefixo dos uploads.
          </p>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center gap-2 min-h-9">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={!canGoUp || loading}
              onClick={goUp}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Acima
            </Button>
            <span className="text-xs font-mono text-slate-700 truncate" title={displayPath}>
              {displayPath}
            </span>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5">{error}</p>
          )}

          <ScrollArea className="h-[240px] border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                A carregar…
              </div>
            ) : dirs.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Sem subpastas aqui.</div>
            ) : (
              <ul className="p-1">
                {dirs.map((d) => (
                  <li key={d.name}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 text-left text-sm px-2 py-2 rounded hover:bg-slate-100"
                      onClick={() => enterDir(d.name)}
                    >
                      <Folder className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="flex-1 truncate">{d.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="ghost" className="text-muted-foreground" onClick={handleClear}>
            Limpar selecção
          </Button>
          <div className="flex-1" />
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading || !!error}>
            Usar esta pasta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
