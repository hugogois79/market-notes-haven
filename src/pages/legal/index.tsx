import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Paperclip, ChevronDown, ChevronRight, Users, Briefcase, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const caseTitle = doc.legal_cases?.title || "Sem Caso";
    if (!acc[caseTitle]) {
      acc[caseTitle] = {};
    }
    
    const docType = doc.document_type;
    if (!acc[caseTitle][docType]) {
      acc[caseTitle][docType] = [];
    }
    
    acc[caseTitle][docType].push(doc);
    return acc;
  }, {} as Record<string, Record<string, LegalDocument[]>>);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [openCases, setOpenCases] = useState<Record<string, boolean>>({});

  const toggleCase = (caseTitle: string) => {
    setOpenCases(prev => ({ ...prev, [caseTitle]: !prev[caseTitle] }));
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navigate = useNavigate();

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
          <Link to="/legal/cases">
            <Button variant="outline">
              <Briefcase className="w-4 h-4 mr-2" />
              Gerir Casos
            </Button>
          </Link>
          <Link to="/legal/contacts">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Gerir Contactos
            </Button>
          </Link>
          <Button onClick={handleAddDocument}>
            <Upload className="w-4 h-4 mr-2" />
            Adicionar Documento
          </Button>
        </div>
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
              {Object.entries(groupedDocuments).map(([caseTitle, docsByType]) => {
                const totalDocs = Object.values(docsByType).reduce((sum, docs) => sum + docs.length, 0);
                const isCaseOpen = openCases[caseTitle];
                
                return (
                  <Collapsible 
                    key={caseTitle} 
                    open={isCaseOpen}
                    onOpenChange={() => toggleCase(caseTitle)}
                    asChild
                  >
                    <>
                      <TableRow className="bg-accent/10 hover:bg-accent/20">
                        <TableCell colSpan={8}>
                          <div className="flex items-center justify-between w-full">
                            <CollapsibleTrigger className="flex items-center gap-3 text-left font-semibold text-base flex-1">
                              {isCaseOpen ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              {caseTitle}
                              <Badge variant="secondary" className="ml-2">
                                {totalDocs}
                              </Badge>
                            </CollapsibleTrigger>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/legal/cases");
                              }}
                            >
                              <Briefcase className="w-4 h-4 mr-1" />
                              Gerir Caso
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <>
                          {Object.entries(docsByType).map(([docType, docs]) => {
                            const sectionKey = `${caseTitle}-${docType}`;
                            const isSectionOpen = openSections[sectionKey];
                            
                            return (
                              <Collapsible
                                key={docType}
                                open={isSectionOpen}
                                onOpenChange={() => toggleSection(sectionKey)}
                                asChild
                              >
                                <>
                                  <TableRow className="bg-muted/30 hover:bg-muted/40">
                                    <TableCell colSpan={8}>
                                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                                        {isSectionOpen ? (
                                          <ChevronDown className="w-3 h-3" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3" />
                                        )}
                                        <span className="uppercase text-xs text-muted-foreground tracking-wider mr-2">
                                          TIPO DE DOCUMENTO
                                        </span>
                                        <Badge
                                          className={documentTypeBadgeColors[docType] || ""}
                                          variant="outline"
                                        >
                                          {docType}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground ml-2">
                                          {docs.length}
                                        </span>
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
                                              className={documentTypeBadgeColors[docType] || ""}
                                              variant="outline"
                                            >
                                              {docType}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                            {doc.attachment_url && (
                                              <a
                                                href={doc.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-primary/80 inline-flex"
                                              >
                                                <Paperclip className="w-4 h-4" />
                                              </a>
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