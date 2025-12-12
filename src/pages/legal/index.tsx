import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Paperclip, ChevronDown, ChevronRight, Users, Briefcase, Pencil, Banknote } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fragment } from "react";
import { DocumentDialog } from "./components/DocumentDialog";
import { FilterBar } from "./components/FilterBar";

interface LegalCase {
  id: string;
  title: string;
  status: string;
}

interface LegalContact {
  id: string;
  name: string;
  role: string;
}

interface LegalDocumentContact {
  contact_id: string;
  legal_contacts: LegalContact;
}

interface LegalDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  attachment_url: string | null;
  attachments: string[] | null;
  created_date: string;
  case_id: string;
  contact_id: string | null;
  legal_cases: LegalCase;
  legal_contacts: LegalContact | null;
  legal_document_contacts?: LegalDocumentContact[];
}

const documentTypeBadgeColors: Record<string, string> = {
  "Notes": "bg-blue-100 text-blue-800 hover:bg-blue-200",
  "Court Document": "bg-orange-100 text-orange-800 hover:bg-orange-200",
  "Motion": "bg-gray-100 text-gray-800 hover:bg-gray-200",
  "Defendant Testimony": "bg-blue-900 text-white hover:bg-blue-800",
};

export default function LegalPage() {
  const [searchParams] = useSearchParams();
  const caseIdFromUrl = searchParams.get("case") || "";
  const contactIdFromUrl = searchParams.get("contact") || "";
  
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [contacts, setContacts] = useState<LegalContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [filters, setFilters] = useState({
    caseId: caseIdFromUrl,
    documentType: "",
    contactId: contactIdFromUrl,
    searchTerm: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Update filter when URL param changes
  useEffect(() => {
    if (caseIdFromUrl) {
      setFilters(prev => ({ ...prev, caseId: caseIdFromUrl }));
    }
  }, [caseIdFromUrl]);

  useEffect(() => {
    if (contactIdFromUrl) {
      setFilters(prev => ({ ...prev, contactId: contactIdFromUrl }));
    }
  }, [contactIdFromUrl]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
  };

  const clearFilters = () => {
    setFilters({ caseId: "", documentType: "", contactId: "", searchTerm: "" });
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (filters.caseId && doc.case_id !== filters.caseId) return false;
      if (filters.documentType && doc.document_type !== filters.documentType) return false;
      if (filters.contactId) {
        // Check junction table first, then fallback to legacy contact_id
        const hasContactInJunction = doc.legal_document_contacts?.some(
          dc => dc.contact_id === filters.contactId
        );
        const hasLegacyContact = doc.contact_id === filters.contactId;
        if (!hasContactInJunction && !hasLegacyContact) return false;
      }
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(search);
        const matchesDescription = doc.description?.toLowerCase().includes(search);
        if (!matchesTitle && !matchesDescription) return false;
      }
      return true;
    });
  }, [documents, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [docsResult, casesResult, contactsResult] = await Promise.all([
        supabase
          .from("legal_documents")
          .select(`
            *,
            legal_cases(id, title, status),
            legal_contacts(id, name, role),
            legal_document_contacts(contact_id, legal_contacts(id, name, role))
          `)
          .eq("user_id", user.id)
          .order("created_date", { ascending: false }),
        supabase
          .from("legal_cases")
          .select("*")
          .eq("user_id", user.id)
          .order("title"),
        supabase
          .from("legal_contacts")
          .select("*")
          .eq("user_id", user.id)
          .order("name")
      ]);

      if (docsResult.error) throw docsResult.error;
      if (casesResult.error) throw casesResult.error;
      if (contactsResult.error) throw contactsResult.error;

      setDocuments(docsResult.data || []);
      setCases(casesResult.data || []);
      setContacts(contactsResult.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Group documents by case only (Airtable style)
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const caseTitle = doc.legal_cases?.title || "Sem Caso";
    if (!acc[caseTitle]) {
      acc[caseTitle] = [];
    }
    acc[caseTitle].push(doc);
    return acc;
  }, {} as Record<string, LegalDocument[]>);

  const [openCases, setOpenCases] = useState<Record<string, boolean>>({});

  // Auto-expand the filtered case when coming from cases page
  useEffect(() => {
    if (caseIdFromUrl && cases.length > 0) {
      const filteredCase = cases.find(c => c.id === caseIdFromUrl);
      if (filteredCase) {
        setOpenCases(prev => ({ ...prev, [filteredCase.title]: true }));
      }
    }
  }, [caseIdFromUrl, cases]);

  const toggleCase = (caseTitle: string) => {
    setOpenCases(prev => ({ ...prev, [caseTitle]: !prev[caseTitle] }));
  };

  const handleEditDocument = (doc: LegalDocument) => {
    setSelectedDocument(doc);
    setDocumentDialogOpen(true);
  };

  const handleAddDocument = () => {
    setSelectedDocument(null);
    setDocumentDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Legal Case Management</h1>
          <p className="text-muted-foreground mt-2">Gestão de Processos e Documentos Jurídicos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddDocument}>
            <Upload className="w-4 h-4 mr-2" />
            Adicionar Documento
          </Button>
        </div>
      </div>

      {/* Separator links for Cases, Contacts and Financeiro */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <Link to="/legal/cases" className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors cursor-pointer">
            <Briefcase className="w-5 h-5 text-amber-600" />
            <span className="uppercase text-[10px] font-medium text-amber-600 dark:text-amber-500 tracking-wider">
              CASES
            </span>
            <span className="font-semibold text-foreground">Gerir Casos</span>
            <Badge variant="secondary" className="ml-auto bg-muted text-muted-foreground text-xs">
              {cases.length}
            </Badge>
          </div>
        </Link>
        <Link to="/legal/contacts" className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors cursor-pointer">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="uppercase text-[10px] font-medium text-blue-600 dark:text-blue-500 tracking-wider">
              CONTACTS
            </span>
            <span className="font-semibold text-foreground">Gerir Contactos</span>
            <Badge variant="secondary" className="ml-auto bg-muted text-muted-foreground text-xs">
              {contacts.length}
            </Badge>
          </div>
        </Link>
        <Link to="/legal/billable-items" className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors cursor-pointer">
            <Banknote className="w-5 h-5 text-green-600" />
            <span className="uppercase text-[10px] font-medium text-green-600 dark:text-green-500 tracking-wider">
              FINANCEIRO
            </span>
            <span className="font-semibold text-foreground">Itens Faturáveis</span>
            <Badge variant="secondary" className="ml-auto bg-muted text-muted-foreground text-xs">
              €
            </Badge>
          </div>
        </Link>
      </div>

      <FilterBar
        cases={cases}
        contacts={contacts}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : Object.keys(groupedDocuments).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum documento encontrado. Adicione o primeiro documento.
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
              <TableHead className="w-8 py-1.5 px-2 text-xs">#</TableHead>
                <TableHead className="w-[28%] py-1.5 px-2 text-xs">Nome do Documento</TableHead>
                <TableHead className="w-[10%] py-1.5 px-2 text-xs">Tipo</TableHead>
                <TableHead className="w-8 text-center py-1.5 px-2">
                  <Paperclip className="w-3 h-3 inline-block" />
                </TableHead>
                <TableHead className="w-[28%] py-1.5 px-2 text-xs">Descrição</TableHead>
                <TableHead className="w-[12%] py-1.5 px-2 text-xs">Data Criação</TableHead>
                <TableHead className="w-[12%] py-1.5 px-2 text-xs">Contatos</TableHead>
                <TableHead className="w-8 py-1.5 px-2"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedDocuments).map(([caseTitle, docs]) => {
                const isCaseOpen = openCases[caseTitle] ?? false;
                
                return (
                  <Fragment key={caseTitle}>
                    {/* Airtable-style separator row */}
                    <TableRow 
                      key={`case-${caseTitle}`}
                      className="bg-amber-50 dark:bg-amber-950/30 border-t-2 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer"
                      onClick={() => toggleCase(caseTitle)}
                    >
                      <TableCell colSpan={8} className="py-1.5 px-2">
                        <div className="flex items-center gap-2 text-left w-full">
                          {isCaseOpen ? (
                            <ChevronDown className="w-3 h-3 text-amber-600" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-amber-600" />
                          )}
                          <span className="uppercase text-[9px] font-medium text-amber-600 dark:text-amber-500 tracking-wider">
                            CASES
                          </span>
                          <span className="font-medium text-xs text-foreground">
                            {caseTitle}
                          </span>
                          <Badge variant="secondary" className="ml-1 bg-muted text-muted-foreground text-[10px] px-1.5 py-0">
                            {docs.length}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isCaseOpen && docs.map((doc, idx) => (
                      <TableRow 
                        key={doc.id} 
                        className="hover:bg-accent/30 cursor-pointer"
                        onClick={() => handleEditDocument(doc)}
                      >
                        <TableCell className="text-muted-foreground text-xs py-1.5 px-2">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium text-xs py-1.5 px-2">
                          {doc.title}
                        </TableCell>
                        <TableCell className="py-1.5 px-2">
                          <Badge
                            className={`${documentTypeBadgeColors[doc.document_type] || ""} text-[10px] px-1.5 py-0`}
                            variant="outline"
                          >
                            {doc.document_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-1.5 px-2" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const attachments = doc.attachments || (doc.attachment_url ? [doc.attachment_url] : []);
                            if (attachments.length === 0) return null;
                            return (
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Download first attachment
                                  try {
                                    const filePath = attachments[0].includes('legal-documents/')
                                      ? attachments[0].split('legal-documents/')[1]
                                      : attachments[0];
                                    
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
                                className="text-primary hover:text-primary/80 inline-flex items-center gap-1"
                                title={attachments.length > 1 ? `${attachments.length} anexos` : "Descarregar anexo"}
                              >
                                <Paperclip className="w-3 h-3" />
                                {attachments.length > 1 && (
                                  <span className="text-[10px] font-medium">{attachments.length}</span>
                                )}
                              </button>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-md py-1.5 px-2">
                          <div className="line-clamp-1">
                            {doc.description || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-1.5 px-2">
                          {new Date(doc.created_date).toLocaleDateString("pt-PT")}
                        </TableCell>
                        <TableCell className="py-1.5 px-2">
                          <div className="flex flex-wrap gap-0.5">
                            {doc.legal_document_contacts && doc.legal_document_contacts.length > 0 ? (
                              doc.legal_document_contacts.map((dc) => (
                                <Badge 
                                  key={dc.contact_id}
                                  variant="secondary" 
                                  className="text-[10px] px-1 py-0"
                                  title={dc.legal_contacts?.role}
                                >
                                  {dc.legal_contacts?.name}
                                </Badge>
                              ))
                            ) : doc.legal_contacts ? (
                              <Badge 
                                variant="secondary" 
                                className="text-[10px] px-1 py-0"
                                title={doc.legal_contacts.role}
                              >
                                {doc.legal_contacts.name}
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 px-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDocument(doc);
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <DocumentDialog
        open={documentDialogOpen}
        onOpenChange={(open) => {
          setDocumentDialogOpen(open);
          if (!open) setSelectedDocument(null);
        }}
        cases={cases}
        contacts={contacts}
        onSuccess={fetchData}
        document={selectedDocument}
      />
    </div>
  );
}