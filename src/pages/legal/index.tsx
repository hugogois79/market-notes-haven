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
                              className="grid grid-cols-12 gap-4 p-4 rounded-md bg-background border hover:bg-accent/50 transition-colors items-start"
                            >
                              <div className="col-span-3">
                                <h4 className="font-semibold text-foreground">{doc.title}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(doc.created_date).toLocaleDateString("pt-PT", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </p>
                              </div>

                              <div className="col-span-1 flex items-center">
                                <Badge
                                  className={documentTypeBadgeColors[docType] || ""}
                                  variant="outline"
                                >
                                  {docType}
                                </Badge>
                              </div>

                              <div className="col-span-1 flex items-center justify-center">
                                {doc.attachment_url && (
                                  <a
                                    href={doc.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80"
                                    title="Ver anexo"
                                  >
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="16" 
                                      height="16" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    >
                                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                                    </svg>
                                  </a>
                                )}
                              </div>

                              <div className="col-span-5">
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {doc.description}
                                  </p>
                                )}
                              </div>

                              <div className="col-span-2 flex items-center justify-end">
                                {doc.legal_contacts && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs cursor-pointer hover:bg-secondary/80"
                                    title={doc.legal_contacts.role}
                                  >
                                    {doc.legal_contacts.name}
                                  </Badge>
                                )}
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