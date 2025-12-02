import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Paperclip, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DocumentDialog } from "./components/DocumentDialog";
import { CaseDialog } from "./components/CaseDialog";
import { ContactDialog } from "./components/ContactDialog";

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
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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

  const groupedDocuments = documents.reduce((acc, doc) => {
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Legal Case Management</h1>
          <p className="text-muted-foreground mt-2">Gestão de Processos e Documentos Jurídicos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCaseDialogOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Novo Caso
          </Button>
          <Button onClick={() => setContactDialogOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
          <Button onClick={() => setDocumentDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Adicionar Documento
          </Button>
        </div>
      </div>

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
                <TableHead className="w-[30%]">Nome do Documento</TableHead>
                <TableHead className="w-[12%]">Tipo</TableHead>
                <TableHead className="w-12 text-center">
                  <Paperclip className="w-4 h-4 inline-block" />
                </TableHead>
                <TableHead className="w-[30%]">Descrição</TableHead>
                <TableHead className="w-[12%]">Data Criação</TableHead>
                <TableHead className="w-[12%]">Contatos</TableHead>
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
                      <TableRow className="bg-accent/20 hover:bg-accent/30">
                        <TableCell colSpan={7} className="font-semibold">
                          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                            {isCaseOpen ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span className="uppercase text-xs text-muted-foreground tracking-wider">
                              CASO RELACIONADO
                            </span>
                          </CollapsibleTrigger>
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-accent/10 hover:bg-accent/20">
                        <TableCell colSpan={7}>
                          <CollapsibleTrigger className="flex items-center gap-3 w-full text-left font-semibold text-base">
                            {caseTitle}
                            <Badge variant="secondary" className="ml-2">
                              {totalDocs}
                            </Badge>
                          </CollapsibleTrigger>
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
                                    <TableCell colSpan={7}>
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
                                        <TableRow key={doc.id} className="hover:bg-accent/30">
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
                                          <TableCell className="text-center">
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
        onOpenChange={setDocumentDialogOpen}
        cases={cases}
        contacts={contacts}
        onSuccess={fetchData}
      />

      <CaseDialog
        open={caseDialogOpen}
        onOpenChange={setCaseDialogOpen}
        onSuccess={fetchData}
      />

      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}