import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Folder,
  FolderOpen,
  ChevronUp,
  Check,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
// Using native scroll for always-visible scrollbar

interface FolderEntry {
  name: string;
  path: string;
}

interface BrowseResult {
  current: string;
  parent: string;
  folders: FolderEntry[];
  error?: string;
}

interface FolderBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

const ROOT_PATH = "/root/Robsonway-Research";

export default function FolderBrowser({
  open,
  onOpenChange,
  onSelect,
  initialPath,
}: FolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath || ROOT_PATH);
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [parentPath, setParentPath] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [pathInput, setPathInput] = useState(initialPath || ROOT_PATH);

  const fetchFolders = useCallback(async (dirPath: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/browse-folders?path=${encodeURIComponent(dirPath)}`
      );
      const data: BrowseResult = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setCurrentPath(data.current);
      setParentPath(data.parent);
      setFolders(data.folders);
      setPathInput(data.current);
      setSelectedPath(null);
    } catch (err: any) {
      setError("Erro ao listar pastas: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchFolders(initialPath || ROOT_PATH);
    }
  }, [open, initialPath, fetchFolders]);

  const handleNavigate = (path: string) => {
    fetchFolders(path);
  };

  const handleDoubleClick = (folder: FolderEntry) => {
    fetchFolders(folder.path);
  };

  const handleSelect = (folder: FolderEntry) => {
    setSelectedPath(folder.path);
    setPathInput(folder.path);
  };

  const handleConfirm = () => {
    const finalPath = selectedPath || currentPath;
    onSelect(finalPath);
    onOpenChange(false);
  };

  const handlePathInputSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      fetchFolders(pathInput);
    }
  };

  // Breadcrumb parts
  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-500" />
            Seleccionar Pasta
          </DialogTitle>
        </DialogHeader>

        {/* Path input */}
        <div className="flex gap-2">
          <Input
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            onKeyDown={handlePathInputSubmit}
            className="font-mono text-sm flex-1"
            placeholder="Caminho..."
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFolders(pathInput)}
            className="shrink-0"
          >
            Ir
          </Button>
        </div>

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto pb-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs"
            onClick={() => handleNavigate(ROOT_PATH)}
            title="Raíz do projecto"
          >
            <Home className="h-3 w-3" />
          </Button>
          <span>/</span>
          {pathParts.map((part, idx) => {
            const fullPath = "/" + pathParts.slice(0, idx + 1).join("/");
            const isLast = idx === pathParts.length - 1;
            return (
              <span key={fullPath} className="flex items-center gap-1 shrink-0">
                {isLast ? (
                  <span className="font-medium text-foreground">{part}</span>
                ) : (
                  <>
                    <button
                      className="hover:text-foreground hover:underline transition-colors"
                      onClick={() => handleNavigate(fullPath)}
                    >
                      {part}
                    </button>
                    <span>/</span>
                  </>
                )}
              </span>
            );
          })}
        </div>

        {/* Folder listing */}
        <div className="flex-1 min-h-0 border rounded-lg overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              A carregar...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full min-h-[200px] text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <div className="p-1">
              {/* Go up */}
              {currentPath !== "/" && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors text-sm text-muted-foreground"
                  onClick={() => handleNavigate(parentPath)}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span>..</span>
                </button>
              )}

              {folders.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Pasta vazia (sem subpastas)
                </div>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.path}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm text-left ${
                      selectedPath === folder.path
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        : "hover:bg-slate-100"
                    }`}
                    onClick={() => handleSelect(folder)}
                    onDoubleClick={() => handleDoubleClick(folder)}
                  >
                    <Folder
                      className={`h-4 w-4 shrink-0 ${
                        selectedPath === folder.path
                          ? "text-blue-500"
                          : "text-amber-500"
                      }`}
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected path preview */}
        <div className="text-xs text-muted-foreground bg-slate-50 rounded-md px-3 py-2 font-mono truncate">
          {selectedPath || currentPath}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-muted-foreground">
            Clique para seleccionar, duplo-clique para abrir
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              <Check className="h-4 w-4 mr-1" />
              Seleccionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
