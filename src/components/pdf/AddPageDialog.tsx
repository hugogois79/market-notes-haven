import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, AlertCircle } from "lucide-react";
import { getPdfPageCount } from "@/utils/pdfPageManipulation";

interface AddPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: number;
  totalPages: number;
  onConfirm: (file: File, pageIndices: number[], insertBefore: boolean) => void;
  isAdding: boolean;
}

export function AddPageDialog({
  open,
  onOpenChange,
  currentPage,
  totalPages,
  onConfirm,
  isAdding,
}: AddPageDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourcePageCount, setSourcePageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [insertPosition, setInsertPosition] = useState<"before" | "after">("after");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setSourcePageCount(0);
      setSelectedPages([]);
      setInsertPosition("after");
      setError(null);
    }
  }, [open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Por favor selecione um ficheiro PDF");
      return;
    }

    setError(null);
    setLoading(true);
    setSelectedFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pageCount = await getPdfPageCount(arrayBuffer);
      setSourcePageCount(pageCount);
      // Select all pages by default
      setSelectedPages(Array.from({ length: pageCount }, (_, i) => i));
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Erro ao carregar o PDF. O ficheiro pode estar corrompido.");
      setSelectedFile(null);
      setSourcePageCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageToggle = (pageIndex: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageIndex)
        ? prev.filter((p) => p !== pageIndex)
        : [...prev, pageIndex].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    if (selectedPages.length === sourcePageCount) {
      setSelectedPages([]);
    } else {
      setSelectedPages(Array.from({ length: sourcePageCount }, (_, i) => i));
    }
  };

  const handleConfirm = () => {
    if (!selectedFile || selectedPages.length === 0) return;
    onConfirm(selectedFile, selectedPages, insertPosition === "before");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Páginas</DialogTitle>
          <DialogDescription>
            Selecione um ficheiro PDF e escolha as páginas a adicionar ao documento atual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File selection */}
          <div className="space-y-2">
            <Label>Ficheiro PDF</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || isAdding}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A carregar...
                </>
              ) : selectedFile ? (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {selectedFile.name}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar ficheiro...
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Page selection */}
          {sourcePageCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Páginas a adicionar</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedPages.length === sourcePageCount
                    ? "Desselecionar todas"
                    : "Selecionar todas"}
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                {Array.from({ length: sourcePageCount }, (_, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-1.5 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={selectedPages.includes(i)}
                      onCheckedChange={() => handlePageToggle(i)}
                    />
                    <span>{i + 1}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPages.length} de {sourcePageCount} páginas selecionadas
              </p>
            </div>
          )}

          {/* Insert position */}
          {sourcePageCount > 0 && (
            <div className="space-y-3">
              <Label>Posição de inserção</Label>
              <RadioGroup
                value={insertPosition}
                onValueChange={(v) => setInsertPosition(v as "before" | "after")}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="before" id="before" />
                  <Label htmlFor="before" className="font-normal cursor-pointer">
                    Antes da página {currentPage}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="after" id="after" />
                  <Label htmlFor="after" className="font-normal cursor-pointer">
                    Depois da página {currentPage}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedFile || selectedPages.length === 0 || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                A adicionar...
              </>
            ) : (
              `Adicionar ${selectedPages.length > 0 ? `${selectedPages.length} página${selectedPages.length > 1 ? "s" : ""}` : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
