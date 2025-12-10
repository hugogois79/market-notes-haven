import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, X, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    created_date: new Date().toISOString().split("T")[0],
  });
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [contactSelectOpen, setContactSelectOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  const isEditMode = !!document;

  useEffect(() => {
    const loadDocumentData = async () => {
      if (document) {
        setFormData({
          title: document.title,
          description: document.description || "",
          document_type: document.document_type,
          case_id: document.case_id,
          created_date: document.created_date,
        });
        
        // Load contacts from junction table
        const { data: contactData } = await supabase
          .from("legal_document_contacts")
          .select("contact_id")
          .eq("document_id", document.id);
        
        if (contactData) {
          setSelectedContactIds(contactData.map(c => c.contact_id));
        } else if (document.contact_id) {
          // Fallback to old single contact_id
          setSelectedContactIds([document.contact_id]);
        } else {
          setSelectedContactIds([]);
        }
      } else {
        setFormData({
          title: "",
          description: "",
          document_type: "",
          case_id: "",
          created_date: new Date().toISOString().split("T")[0],
        });
        setSelectedContactIds([]);
      }
      setFile(null);
    };

    if (open) {
      loadDocumentData();
    }
  }, [document, open]);

  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleRemoveContact = (contactId: string) => {
    setSelectedContactIds(prev => prev.filter(id => id !== contactId));
  };

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
            contact_id: selectedContactIds[0] || null, // Keep backward compatibility
            created_date: formData.created_date,
            attachment_url: attachmentUrl,
          })
          .eq("id", document.id);

        if (error) throw error;

        // Update junction table
        await supabase
          .from("legal_document_contacts")
          .delete()
          .eq("document_id", document.id);

        if (selectedContactIds.length > 0) {
          const contactRelations = selectedContactIds.map(contactId => ({
            document_id: document.id,
            contact_id: contactId,
          }));
          await supabase.from("legal_document_contacts").insert(contactRelations);
        }

        toast.success("Documento atualizado com sucesso");
      } else {
        const { data: newDoc, error } = await supabase.from("legal_documents").insert({
          ...formData,
          contact_id: selectedContactIds[0] || null, // Keep backward compatibility
          attachment_url: attachmentUrl,
          user_id: user.id,
        }).select().single();

        if (error) throw error;

        // Insert into junction table
        if (selectedContactIds.length > 0 && newDoc) {
          const contactRelations = selectedContactIds.map(contactId => ({
            document_id: newDoc.id,
            contact_id: contactId,
          }));
          await supabase.from("legal_document_contacts").insert(contactRelations);
        }

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

  const selectedContacts = contacts.filter(c => selectedContactIds.includes(c.id));
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

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
            <Label>Contatos</Label>
            <Popover open={contactSelectOpen} onOpenChange={setContactSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {selectedContactIds.length > 0
                    ? `${selectedContactIds.length} contato(s) selecionado(s)`
                    : "Selecione os contatos"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-background border" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar contatos..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {filteredContacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">Nenhum contato encontrado</p>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => handleToggleContact(contact.id)}
                      >
                        <Checkbox
                          checked={selectedContactIds.includes(contact.id)}
                          onCheckedChange={() => handleToggleContact(contact.id)}
                        />
                        <span className="text-sm">{contact.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            {selectedContacts.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedContacts.map((contact) => (
                  <Badge key={contact.id} variant="secondary" className="gap-1">
                    {contact.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <span>Anexo atual:</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const filePath = document.attachment_url!.includes('legal-documents/')
                        ? document.attachment_url!.split('legal-documents/')[1]
                        : document.attachment_url!;
                      
                      const { data, error } = await supabase.storage
                        .from("legal-documents")
                        .download(filePath);
                      
                      if (error) throw error;
                      if (data) {
                        const url = URL.createObjectURL(data);
                        const fileName = filePath.split('/').pop() || 'attachment';
                        const link = window.document.createElement('a');
                        link.href = url;
                        link.download = fileName;
                        window.document.body.appendChild(link);
                        link.click();
                        window.document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }
                    } catch (error) {
                      console.error("Error downloading file:", error);
                      toast.error("Erro ao descarregar ficheiro");
                    }
                  }}
                  className="text-primary underline hover:text-primary/80 truncate max-w-[300px]"
                  title={document.attachment_url.split('/').pop() || 'ficheiro'}
                >
                  {document.attachment_url.split('/').pop() || 'Ver ficheiro'}
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
                {loading ? "A guardar..." : "Guardar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
