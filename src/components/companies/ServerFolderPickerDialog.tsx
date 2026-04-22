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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWorkFilesListUrl } from "@/hooks/useFileServerBaseUrl";
import { ArrowLeft, ChevronRight, Folder, Loader2, Search } from "lucide-react";

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

/** Caminho relativo normalizado (sem barras inicial/final, barras `/`). */
function normalizeRelativeFolderPath(raw: string): string {
  return raw
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function folderDisplayFromApi(data: ListResponse): string {
  const f = data.folder;
  if (!f || f === "." || f === "") return "";
  return f.replace(/\\/g, "/");
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
  /** Caminho editável antes de «Ir» — sincronizado com a pasta listada com sucesso. */
  const [pathDraft, setPathDraft] = useState("");
  /** Filtro client-side dos nomes no nível actual. */
  const [listFilter, setListFilter] = useState("");

  useEffect(() => {
    if (!open) return;
    const seed = normalizeRelativeFolderPath(initialRelativePath || startInsideFolder || "");
    setCurrentFolder(seed);
    setPathDraft(seed);
    setListFilter("");
    setError(null);
    setData(null);
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
        if (!cancelled) {
          const payload = j as ListResponse;
          setData(payload);
          setPathDraft(folderDisplayFromApi(payload));
        }
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

  useEffect(() => {
    setListFilter("");
  }, [currentFolder]);

  const dirs = (data?.items || [])
    .filter((i) => i.type === "dir")
    .sort((a, b) => a.name.localeCompare(b.name));

  const q = listFilter.trim().toLowerCase();
  const filteredDirs = q ? dirs.filter((d) => d.name.toLowerCase().includes(q)) : dirs;

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

  const goToPathDraft = () => {
    setCurrentFolder(normalizeRelativeFolderPath(pathDraft));
  };

  /** Com erro, `data` fica null — mostrar o caminho pedido, não fingir que estamos na raiz. */
  const displayPath =
    data != null
      ? data.folder && data.folder !== "."
        ? data.folder
        : "(raiz — WORK_FILES_ROOT)"
      : currentFolder
        ? `Pedido: ${currentFolder}`
        : "(raiz — WORK_FILES_ROOT)";

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
            Podes <strong className="font-medium text-foreground">escrever o caminho completo</strong> e carregar em «Ir», filtrar a
            lista, ou escolher no menu. Confirma na pasta que queres usar como prefixo dos uploads.{" "}
            <span className="text-amber-800/90">
              Splendidoption: o nome no disco é <code className="text-[11px]">Splendidoption (PT)</code>, p.ex.{" "}
              <code className="text-[11px]">Splendidoption (PT)/Work</code> — não «Splendidoption/work» sem (PT).
            </span>
          </p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="server-folder-path" className="text-xs">
              Caminho relativo à raiz (escrever e «Ir»)
            </Label>
            <div className="flex gap-2">
              <Input
                id="server-folder-path"
                className="font-mono text-xs h-9"
                placeholder="ex.: Sustainable Yield (UK)/Work/2026/04 April 2026"
                value={pathDraft}
                onChange={(e) => setPathDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    goToPathDraft();
                  }
                }}
                disabled={loading}
                spellCheck={false}
                autoComplete="off"
              />
              <Button type="button" size="sm" className="shrink-0 h-9" onClick={goToPathDraft} disabled={loading}>
                Ir
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Usa <code className="text-[10px]">/</code> entre pastas; o nome tem de coincidir com o disco (maiúsculas, «(UK)», etc.).
              Sob <code className="text-[10px]">Work</code> costuma existir o ano, p.ex.{" "}
              <code className="text-[10px]">Work/2026/04 April 2026</code>.
            </p>
          </div>

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

          <div className="space-y-1.5">
            <Label htmlFor="server-folder-filter" className="text-xs flex items-center gap-1">
              <Search className="h-3 w-3" />
              Filtrar pastas neste nível
            </Label>
            <Input
              id="server-folder-filter"
              className="h-9 text-sm"
              placeholder="Escreve parte do nome…"
              value={listFilter}
              onChange={(e) => setListFilter(e.target.value)}
              disabled={loading || !!error}
            />
          </div>

          {!loading && !error && dirs.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Menu (lista filtrada)</Label>
              <Select
                key={currentFolder}
                onValueChange={(name) => {
                  enterDir(name);
                }}
                disabled={filteredDirs.length === 0}
              >
                <SelectTrigger className="h-9 text-left text-sm">
                  <SelectValue
                    placeholder={
                      filteredDirs.length === 0
                        ? "Nenhuma pasta corresponde ao filtro"
                        : "Escolher subpasta…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredDirs.map((d) => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <div className="space-y-2">
              <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5 whitespace-pre-wrap">
                {error}
              </p>
              {currentFolder !== "" &&
                (error.includes("Pasta não encontrada") || error.includes("não encontrada")) && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setError(null);
                      setCurrentFolder("");
                    }}
                  >
                    Abrir na raiz (WORK_FILES_ROOT) e listar pastas existentes
                  </Button>
                )}
            </div>
          )}

          <ScrollArea className="h-[220px] border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                A carregar…
              </div>
            ) : filteredDirs.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {dirs.length === 0 ? "Sem subpastas aqui." : "Nenhuma pasta corresponde ao filtro."}
              </div>
            ) : (
              <ul className="p-1">
                {filteredDirs.map((d) => (
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
