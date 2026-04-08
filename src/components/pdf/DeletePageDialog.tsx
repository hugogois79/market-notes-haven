import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeletePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageNumber: number;
  totalPages: number;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeletePageDialog({
  open,
  onOpenChange,
  pageNumber,
  totalPages,
  onConfirm,
  isDeleting,
}: DeletePageDialogProps) {
  const canDelete = totalPages > 1;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Página</AlertDialogTitle>
          <AlertDialogDescription>
            {canDelete ? (
              <>
                Tem a certeza que deseja eliminar a <strong>página {pageNumber}</strong> de {totalPages}?
                <br />
                <span className="text-muted-foreground mt-2 block">
                  Esta ação não pode ser desfeita após guardar as alterações.
                </span>
              </>
            ) : (
              <>
                Não é possível eliminar a única página do documento.
                <br />
                <span className="text-muted-foreground mt-2 block">
                  O documento deve ter pelo menos uma página.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A eliminar...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
