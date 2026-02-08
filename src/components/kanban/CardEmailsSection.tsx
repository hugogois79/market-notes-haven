import { useState, useEffect, useRef } from "react";
import { Plus, Download, Trash2, FileText, ChevronUp, Loader2, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KanbanService, CardEmail } from "@/services/kanbanService";
import { toast } from "sonner";
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

interface CardEmailsSectionProps {
  cardId: string;
}

export default function CardEmailsSection({ cardId }: CardEmailsSectionProps) {
  const [emails, setEmails] = useState<CardEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CardEmail | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewerEmail, setViewerEmail] = useState<CardEmail | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  // Form state
  const [emailDate, setEmailDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [subject, setSubject] = useState("");
  const [author, setAuthor] = useState("");
  const [recipient, setRecipient] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEmails();
  }, [cardId]);

  async function loadEmails() {
    try {
      setLoading(true);
      const data = await KanbanService.getCardEmails(cardId);
      setEmails(data);
    } catch (err) {
      console.error("Error loading emails:", err);
      toast.error("Erro ao carregar emails");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEmailDate(new Date().toISOString().split("T")[0]);
    setSubject("");
    setAuthor("");
    setRecipient("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    if (!subject.trim()) {
      toast.error("O assunto é obrigatório");
      return;
    }
    if (!author.trim()) {
      toast.error("O autor é obrigatório");
      return;
    }
    if (!file) {
      toast.error("Selecciona um ficheiro PDF");
      return;
    }

    try {
      setSaving(true);
      const newEmail = await KanbanService.uploadCardEmail(cardId, file, {
        email_date: emailDate,
        subject: subject.trim(),
        author: author.trim(),
        recipient: recipient.trim() || undefined,
      });
      setEmails((prev) => [newEmail, ...prev]);
      resetForm();
      setShowForm(false);
      toast.success("Email adicionado");
    } catch (err) {
      console.error("Error uploading email:", err);
      toast.error("Erro ao guardar email");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await KanbanService.deleteCardEmail(deleteTarget.id, deleteTarget.storage_path);
      setEmails((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success("Email eliminado");
    } catch (err) {
      console.error("Error deleting email:", err);
      toast.error("Erro ao eliminar email");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleDownload(email: CardEmail) {
    try {
      setDownloadingId(email.id);
      const url = await KanbanService.getEmailDownloadUrl(email.file_url, email.storage_path);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error downloading email:", err);
      toast.error("Erro ao abrir ficheiro");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleView(email: CardEmail) {
    try {
      setViewerEmail(email);
      setViewerLoading(true);
      setViewerUrl(null);
      const url = await KanbanService.getEmailDownloadUrl(email.file_url, email.storage_path);
      setViewerUrl(url);
    } catch (err) {
      console.error("Error loading PDF for viewer:", err);
      toast.error("Erro ao carregar PDF");
      setViewerEmail(null);
    } finally {
      setViewerLoading(false);
    }
  }

  function closeViewer() {
    setViewerEmail(null);
    setViewerUrl(null);
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="h-7 text-xs"
        >
          {showForm ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Fechar
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </>
          )}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border rounded-lg p-3 mb-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={emailDate}
                onChange={(e) => setEmailDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">De (Autor)</Label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Remetente..."
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Para (Receptor)</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Destinatário..."
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Assunto</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do email..."
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Ficheiro PDF</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || !subject.trim() || !author.trim() || !file}
              className="h-7 text-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  A guardar...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Email list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : emails.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-1">Sem emails associados</p>
      ) : (
        <div className="space-y-1">
          {emails.map((email) => (
            <div
              key={email.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group text-sm cursor-pointer"
              onClick={() => handleView(email)}
              title="Clica para ver o PDF"
            >
              <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-sm leading-tight">
                  {email.subject}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <span>{formatDate(email.email_date)}</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="truncate">De: {email.author}</span>
                  {email.recipient && (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="truncate">Para: {email.recipient}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); handleView(email); }}
                  title="Ver PDF"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); handleDownload(email); }}
                  disabled={downloadingId === email.id}
                  title="Download PDF"
                >
                  {downloadingId === email.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(email); }}
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      <Dialog open={!!viewerEmail} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between pr-8">
              <div className="min-w-0">
                <DialogTitle className="text-base truncate">
                  {viewerEmail?.subject}
                </DialogTitle>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {viewerEmail && (
                    <>
                      <span>{formatDate(viewerEmail.email_date)}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span>De: {viewerEmail.author}</span>
                      {viewerEmail.recipient && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Para: {viewerEmail.recipient}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-shrink-0"
                onClick={() => viewerEmail && handleDownload(viewerEmail)}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/30">
            {viewerLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : viewerUrl ? (
              <iframe
                src={viewerUrl}
                className="w-full h-full border-0"
                title={viewerEmail?.subject || "PDF Viewer"}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Erro ao carregar PDF
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar email</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres eliminar o email{" "}
              <strong>"{deleteTarget?.subject}"</strong>? O ficheiro PDF será também eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
