import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
        <Accordion type="multiple" className="space-y-4">
          {Object.entries(groupedDocuments).map(([caseTitle, docsByType]) => (
            <AccordionItem
              key={caseTitle}
              value={caseTitle}
              className="border rounded-lg bg-card"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="font-semibold text-lg">{caseTitle}</span>
                  <Badge variant="secondary">
                    {Object.values(docsByType).reduce((sum, docs) => sum + docs.length, 0)} documentos
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <Accordion type="multiple" className="space-y-2">
                  {Object.entries(docsByType).map(([docType, docs]) => (
                    <AccordionItem
                      key={docType}
                      value={docType}
                      className="border rounded-md bg-muted/30"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={documentTypeBadgeColors[docType] || ""}
                            variant="outline"
                          >
                            {docType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {docs.length} {docs.length === 1 ? "documento" : "documentos"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3">
                        <div className="space-y-2">
                          {docs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-start gap-4 p-3 rounded-md bg-background border hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground mb-1">{doc.title}</h4>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {doc.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span>{new Date(doc.created_date).toLocaleDateString("pt-PT")}</span>
                                  {doc.legal_contacts && (
                                    <Badge variant="outline" className="text-xs">
                                      {doc.legal_contacts.name}
                                    </Badge>
                                  )}
                                  {doc.attachment_url && (
                                    <a
                                      href={doc.attachment_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      Ver anexo
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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