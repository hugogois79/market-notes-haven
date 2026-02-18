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
import { Upload, Trash2, X, ChevronDown, Search, Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  attachments: string[] | null;
  server_path: string | null;
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
  // Drag and drop support
  initialFiles?: File[];
  initialCaseId?: string;
  initialTitle?: string;
}

const DOCUMENT_TYPES = ["Notes", "Court Document", "Motion", "Defendant Testimony", "Evidence"];

export function DocumentDialog({ 
  open, 
  onOpenChange, 
  cases, 
  contacts, 
  onSuccess, 
  document,
  initialFiles,
  initialCaseId,
  initialTitle 
}: DocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    document_type: "",
    case_id: "",
    created_date: new Date().toISOString().split("T")[0],
  });
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([]);
  const [contactSelectOpen, setContactSelectOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [caseSelectOpen, setCaseSelectOpen] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");

  const isEditMode = !!document;

  // AI Analysis function
  const handleAiAnalyze = async (file: File) => {
    setAiAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Upload file temporarily to get a URL accessible by n8n
      const tempFileName = `temp/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      
      const { error: uploadError } = await supabase.storage
        .from("legal-documents")
        .upload(tempFileName, file);

      if (uploadError) throw uploadError;

      // Generate signed URL for n8n to access (1 hour validity)
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from("legal-documents")
        .createSignedUrl(tempFileName, 3600);

      if (signedError || !signedUrlData?.signedUrl) {
        throw new Error("Não foi possível gerar URL de acesso");
      }

      const mimeType = file.type || 'application/octet-stream';

      const { data, error } = await supabase.functions.invoke('analyze-legal-document', {
        body: {
          fileUrl: signedUrlData.signedUrl,
          fileName: file.name,
          mimeType,
        },
      });

      // Cleanup: remove temporary file
      await supabase.storage.from("legal-documents").remove([tempFileName]);

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.message || 'Erro ao analisar documento');
      }

      const extracted = data.data;
      if (extracted) {
        // Fill form fields with extracted data
        setFormData(prev => ({
          ...prev,
          title: extracted.title || prev.title || file.name.replace(/\.[^/.]+$/, ''),
          description: extracted.description || extracted.summary || prev.description,
          document_type: extracted.document_type || prev.document_type,
          created_date: extracted.date || prev.created_date,
        }));
        toast.success('Dados extraídos com sucesso!');
      } else {
        toast.info('Não foi possível extrair dados do documento');
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast.error('Erro ao analisar documento');
    } finally {
      setAiAnalyzing(false);
    }
  };

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
        
        // Load existing attachments
        const attachments = document.attachments || (document.attachment_url ? [document.attachment_url] : []);
        setExistingAttachments(attachments);
        
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
        // New document mode - use initial values from drag and drop if provided
        setFormData({
          title: initialTitle || "",
          description: "",
          document_type: "",
          case_id: initialCaseId || "",
          created_date: new Date().toISOString().split("T")[0],
        });
        setSelectedContactIds([]);
        setExistingAttachments([]);
        setFiles(initialFiles || []);
      }
      if (document) {
        setFiles([]);
      }
      setAttachmentsToRemove([]);
      setContactSearch("");
      setCaseSearch("");
    };

    if (open) {
      loadDocumentData();
    }
  }, [document, open, initialFiles, initialCaseId, initialTitle]);

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

  const filteredCases = cases.filter(c =>
    c.title.toLowerCase().includes(caseSearch.toLowerCase())
  );

  const selectedCase = cases.find(c => c.id === formData.case_id);

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

      // Calculate final attachments list (legacy Supabase paths)
      let finalAttachments = existingAttachments.filter(a => !attachmentsToRemove.includes(a));

      // Delete removed attachments from Supabase storage
      for (const attachmentPath of attachmentsToRemove) {
        const filePath = attachmentPath.includes('legal-documents/')
          ? attachmentPath.split('legal-documents/')[1]
          : attachmentPath;
        await supabase.storage.from("legal-documents").remove([filePath]);
      }

      // Upload new files to server (via API) if case has a folder mapping
      let serverPath: string | null = null;
      if (files.length > 0) {
        const { data: folderMappings } = await supabase
          .from("legal_case_folders")
          .select("folder_path")
          .eq("case_id", formData.case_id)
          .limit(1);

        const targetFolder = folderMappings?.[0]?.folder_path;

        if (targetFolder) {
          for (const file of files) {
            const params = new URLSearchParams({
              folder: targetFolder,
              title: formData.title,
              date: formData.created_date,
              filename: file.name,
            });
            const arrayBuf = await file.arrayBuffer();
            const resp = await fetch(`/api/legal-files/upload?${params}`, {
              method: "POST",
              headers: { "Content-Type": "application/octet-stream" },
              body: arrayBuf,
            });
            if (!resp.ok) throw new Error("Erro no upload para o servidor");
            const result = await resp.json();
            if (!serverPath) serverPath = result.server_path;
          }
        } else {
          // Fallback: upload to Supabase if no folder mapping
          for (const file of files) {
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `${user.id}/${crypto.randomUUID()}_${sanitizedName}`;
            const { error: uploadError } = await supabase.storage
              .from("legal-documents")
              .upload(fileName, file);
            if (uploadError) throw uploadError;
            finalAttachments.push(fileName);
          }
        }
      }

      const attachmentUrl = finalAttachments.length > 0 ? finalAttachments[0] : null;

      if (isEditMode) {
        const updateData: Record<string, any> = {
          title: formData.title,
          description: formData.description || null,
          document_type: formData.document_type,
          case_id: formData.case_id,
          contact_id: selectedContactIds[0] || null,
          created_date: formData.created_date,
          attachment_url: attachmentUrl,
          attachments: finalAttachments,
        };
        if (serverPath) updateData.server_path = serverPath;

        const { error } = await supabase
          .from("legal_documents")
          .update(updateData)
          .eq("id", document.id);

        if (error) throw error;

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
        const insertData: Record<string, any> = {
          ...formData,
          contact_id: selectedContactIds[0] || null,
          attachment_url: attachmentUrl,
          attachments: finalAttachments,
          user_id: user.id,
        };
        if (serverPath) insertData.server_path = serverPath;

        const { data: newDoc, error } = await supabase
          .from("legal_documents")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

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
            <Popover open={caseSelectOpen} onOpenChange={setCaseSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {selectedCase?.title || "Selecione o caso"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-background border" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar casos..."
                      value={caseSearch}
                      onChange={(e) => setCaseSearch(e.target.value)}
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {filteredCases.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">Nenhum caso encontrado</p>
                  ) : (
                    filteredCases.map((c) => (
                      <div
                        key={c.id}
                        className={`flex items-center p-2 hover:bg-muted rounded cursor-pointer ${formData.case_id === c.id ? 'bg-muted' : ''}`}
                        onClick={() => {
                          setFormData({ ...formData, case_id: c.id });
                          setCaseSelectOpen(false);
                          setCaseSearch("");
                        }}
                      >
                        <span className="text-sm">{c.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
                          onClick={(e) => e.stopPropagation()}
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
            <Label htmlFor="file">Anexos</Label>
            
            {/* Server file (from migration) */}
            {isEditMode && document?.server_path && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Ficheiro no servidor:</span>
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 rounded px-2 py-1">
                  <a
                    href={`https://drive.robsonway.com/${document.server_path.split("/").map(encodeURIComponent).join("/")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 dark:text-emerald-400 underline hover:opacity-80 text-sm truncate max-w-[300px]"
                    title={document.server_path}
                  >
                    {document.server_path.split("/").pop()}
                  </a>
                </div>
              </div>
            )}

            {/* Existing attachments (Supabase legacy) */}
            {existingAttachments.filter(a => !attachmentsToRemove.includes(a)).length > 0 && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Anexos existentes:</span>
                <div className="flex flex-wrap gap-2">
                  {existingAttachments.filter(a => !attachmentsToRemove.includes(a)).map((attachment, index) => {
                    // Extract original filename from path (remove UUID prefix if present)
                    const fullName = attachment.split('/').pop() || 'ficheiro';
                    // Match UUID pattern at the start: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx_
                    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;
                    const fileName = fullName.replace(uuidPattern, '');
                    return (
                      <div key={index} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const filePath = attachment.includes('legal-documents/')
                                ? attachment.split('legal-documents/')[1]
                                : attachment;
                              
                              const { data, error } = await supabase.storage
                                .from("legal-documents")
                                .download(filePath);
                              
                              if (error) throw error;
                              if (data) {
                                const url = URL.createObjectURL(data);
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
                          className="text-primary underline hover:text-primary/80 text-sm truncate max-w-[200px]"
                          title={fileName}
                        >
                          {fileName}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachmentsToRemove(prev => [...prev, attachment])}
                          className="text-destructive hover:text-destructive/80 ml-1"
                          title="Remover anexo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New files to upload */}
            {files.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Novos ficheiros:</span>
                <div className="flex flex-wrap gap-2">
                  {files.map((f, index) => (
                    <div key={index} className="flex items-center gap-1 bg-primary/10 rounded px-2 py-1">
                      <Upload className="w-3 h-3 text-primary" />
                      <span className="text-sm truncate max-w-[200px]" title={f.name}>{f.name}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleAiAnalyze(f)}
                              disabled={aiAnalyzing}
                              className="text-primary hover:text-primary/80 ml-1 disabled:opacity-50"
                              title="Analisar com AI"
                            >
                              {aiAnalyzing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Extrair dados com AI</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <button
                        type="button"
                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-destructive hover:text-destructive/80 ml-1"
                        title="Remover ficheiro"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                multiple
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  setFiles(prev => [...prev, ...newFiles]);
                  e.target.value = '';
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceites: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (pode selecionar vários ficheiros)
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
