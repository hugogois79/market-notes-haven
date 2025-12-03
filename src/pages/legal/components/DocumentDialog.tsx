import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";

interface LegalDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  attachment_url: string | null;
  created_date: string;
  case_id: string;
  contact_id: string | null;
}

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: Array<{ id: string; title: string }>;
  contacts: Array<{ id: string; name: string }>;
  onSuccess: () => void;
  document?: LegalDocument | null;
}

const DOCUMENT_TYPES = ["Notes", "Court Document", "Motion", "Defendant Testimony"];

export function DocumentDialog({ open, onOpenChange, cases, contacts, onSuccess, document }: DocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    document_type: "",
    case_id: "",
    contact_id: "",
    created_date: new Date().toISOString().split("T")[0],
  });
  const [file, setFile] = useState<File | null>(null);

  const isEditMode = !!document;

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        description: document.description || "",
        document_type: document.document_type,
        case_id: document.case_id,
        contact_id: document.contact_id || "",
        created_date: document.created_date,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        document_type: "",
        case_id: "",
        contact_id: "",
        created_date: new Date().toISOString().split("T")[0],
      });
    }
    setFile(null);
  }, [document, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.document_type || !formData.case_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let attachmentUrl = document?.attachment_url || null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("legal-documents")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Store the file path, not the public URL (bucket is private)
        attachmentUrl = fileName;
      }

      if (isEditMode) {
        const { error } = await supabase
          .from("legal_documents")
          .update({
            title: formData.title,
            description: formData.description || null,
            document_type: formData.document_type,
            case_id: formData.case_id,
            contact_id: formData.contact_id || null,
            created_date: formData.created_date,
            attachment_url: attachmentUrl,
          })
          .eq("id", document.id);

        if (error) throw error;
        toast.success("Documento atualizado com sucesso");
      } else {
        const { error } = await supabase.from("legal_documents").insert({
          ...formData,
          contact_id: formData.contact_id || null,
          attachment_url: attachmentUrl,
          user_id: user.id,
        });

        if (error) throw error;
        toast.success("Documento criado com sucesso");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error saving document:", error);
      toast.error(isEditMode ? "Erro ao atualizar documento" : "Erro ao criar documento");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document || !confirm("Tem certeza que deseja eliminar este documento?")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("legal_documents")
        .delete()
        .eq("id", document.id);

      if (error) throw error;

      toast.success("Documento eliminado com sucesso");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error("Erro ao eliminar documento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Documento" : "Adicionar Novo Documento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nome do documento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">Tipo *</Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_id">Caso *</Label>
            <Select
              value={formData.case_id}
              onValueChange={(value) => setFormData({ ...formData, case_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o caso" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_id">Contato</Label>
            <Select
              value={formData.contact_id}
              onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o contato (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="created_date">Data</Label>
            <Input
              id="created_date"
              type="date"
              value={formData.created_date}
              onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada do documento"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Anexo</Label>
            {document?.attachment_url && !file && (
              <div className="text-sm text-muted-foreground mb-2">
                Anexo atual:{" "}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const filePath = document.attachment_url!.includes('legal-documents/')
                        ? document.attachment_url!.split('legal-documents/')[1]
                        : document.attachment_url!;
                      
                      const { data, error } = await supabase.storage
                        .from("legal-documents")
                        .createSignedUrl(filePath, 3600);
                      
                      if (error) throw error;
                      if (data?.signedUrl) {
                        window.open(data.signedUrl, '_blank');
                      }
                    } catch (error) {
                      console.error("Error getting signed URL:", error);
                      toast.error("Erro ao abrir ficheiro");
                    }
                  }}
                  className="text-primary underline"
                >
                  Ver ficheiro
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {file && <Upload className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceites: PDF, DOC, DOCX, JPG, PNG
            </p>
          </div>

          <div className="flex justify-between gap-2 pt-4">
            <div>
              {isEditMode && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "A guardar..." : isEditMode ? "Guardar" : "Criar Documento"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
