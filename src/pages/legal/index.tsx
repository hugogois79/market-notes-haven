import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Paperclip, ChevronDown, ChevronRight, Users, Briefcase, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

interface LegalDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  attachment_url: string | null;
  created_date: string;
  case_id: string;
  contact_id: string | null;
  legal_cases: LegalCase;
  legal_contacts: LegalContact | null;
}

const documentTypeBadgeColors: Record<string, string> = {
  "Notes": "bg-blue-100 text-blue-800 hover:bg-blue-200",
  "Court Document": "bg-orange-100 text-orange-800 hover:bg-orange-200",
  "Motion": "bg-gray-100 text-gray-800 hover:bg-gray-200",
  "Defendant Testimony": "bg-blue-900 text-white hover:bg-blue-800",
};

export default function LegalPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [contacts, setContacts] = useState<LegalContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [filters, setFilters] = useState({
    caseId: "",
    documentType: "",
    contactId: "",
    searchTerm: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

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
      if (filters.contactId && doc.contact_id !== filters.contactId) return false;
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
            legal_contacts(id, name, role)
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

      {/* Separator links for Cases and Contacts */}
      <div className="flex gap-4 mb-4">
        <Link to="/legal/cases" className="flex-1">
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
        <Link to="/legal/contacts" className="flex-1">
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
              <TableHead className="w-12">#</TableHead>
                <TableHead className="w-[28%]">Nome do Documento</TableHead>
                <TableHead className="w-[10%]">Tipo</TableHead>
                <TableHead className="w-12 text-center">
                  <Paperclip className="w-4 h-4 inline-block" />
                </TableHead>
                <TableHead className="w-[28%]">Descrição</TableHead>
                <TableHead className="w-[12%]">Data Criação</TableHead>
                <TableHead className="w-[12%]">Contatos</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedDocuments).map(([caseTitle, docs]) => {
                const isCaseOpen = openCases[caseTitle];
                
                return (
                  <Collapsible 
                    key={caseTitle} 
                    open={isCaseOpen}
                    onOpenChange={() => toggleCase(caseTitle)}
                    asChild
                  >
                    <>
                      {/* Airtable-style separator row */}
                      <TableRow className="bg-amber-50 dark:bg-amber-950/30 border-t-2 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50">
                        <TableCell colSpan={8} className="py-2">
                          <CollapsibleTrigger className="flex items-center gap-3 text-left w-full">
                            {isCaseOpen ? (
                              <ChevronDown className="w-4 h-4 text-amber-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-amber-600" />
                            )}
                            <span className="uppercase text-[10px] font-medium text-amber-600 dark:text-amber-500 tracking-wider">
                              CASES
                            </span>
                            <span className="font-semibold text-foreground">
                              {caseTitle}
                            </span>
                            <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground text-xs">
                              {docs.length}
                            </Badge>
                          </CollapsibleTrigger>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <>
                          {docs.map((doc, idx) => (
                            <TableRow 
                              key={doc.id} 
                              className="hover:bg-accent/30 cursor-pointer"
                              onClick={() => handleEditDocument(doc)}
                            >
                              <TableCell className="text-muted-foreground text-sm">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                {doc.title}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={documentTypeBadgeColors[doc.document_type] || ""}
                                  variant="outline"
                                >
                                  {doc.document_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                {doc.attachment_url && (
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        const filePath = doc.attachment_url!.includes('legal-documents/')
                                          ? doc.attachment_url!.split('legal-documents/')[1]
                                          : doc.attachment_url!;
                                        
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
                                    className="text-primary hover:text-primary/80 inline-flex"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                  </button>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-md">
                                <div className="line-clamp-2">
                                  {doc.description || "-"}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(doc.created_date).toLocaleDateString("pt-PT")}
                              </TableCell>
                              <TableCell>
                                {doc.legal_contacts && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs"
                                    title={doc.legal_contacts.role}
                                  >
                                    {doc.legal_contacts.name}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDocument(doc);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
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