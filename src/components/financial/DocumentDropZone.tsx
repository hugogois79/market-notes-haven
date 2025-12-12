import { useState, useCallback, useMemo } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import TransactionDialog from "./TransactionDialog";
import * as pdfjsLib from "pdfjs-dist";
interface DocumentAnalysis {
  documentType: "loan" | "transaction" | "unknown";
  confidence: number;
  summary: string;
  extractedData: {
    amount?: number | null;
    interestRate?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    lender?: string | null;
    borrower?: string | null;
    date?: string | null;
    entityName?: string | null;
    description?: string | null;
    transactionType?: "income" | "expense" | null;
    invoiceNumber?: string | null;
    expenseItems?: Array<{
      supplier: string;
      description: string;
      amount: number;
    }> | null;
  };
  reasoning: string;
}

interface DocumentDropZoneProps {
  companyId: string | null;
}

export default function DocumentDropZone({ companyId }: DocumentDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [prefilledTransaction, setPrefilledTransaction] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Fetch expense projects to match project name from filename
  const { data: expenseProjects } = useQuery({
    queryKey: ["expense-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Extract project name from filename (looks for [PROJECT_NAME] pattern)
  const extractProjectFromFilename = (filename: string): string | null => {
    const match = filename.match(/\[([^\]]+)\]/);
    return match ? match[1] : null;
  };

  // Find matching project by name (fuzzy match)
  const findMatchingProject = (projectName: string) => {
    if (!expenseProjects || !projectName) return null;
    
    const normalizedSearch = projectName.toLowerCase().trim();
    
    // First try exact match
    const exactMatch = expenseProjects.find(
      p => p.name.toLowerCase() === normalizedSearch
    );
    if (exactMatch) return exactMatch;
    
    // Then try partial match
    const partialMatch = expenseProjects.find(
      p => p.name.toLowerCase().includes(normalizedSearch) ||
           normalizedSearch.includes(p.name.toLowerCase())
    );
    return partialMatch || null;
  };

  const handleCreateTransaction = () => {
    if (!analysis || !companyId) return;
    
    const extracted = analysis.extractedData;
    const totalAmount = extracted.amount || 0;
    const vatRate = 23; // Default VAT rate
    const netAmount = totalAmount / (1 + vatRate / 100);
    const vatAmount = totalAmount - netAmount;

    // Try to find project from filename
    const projectNameFromFile = extractProjectFromFilename(fileName);
    const matchedProject = projectNameFromFile ? findMatchingProject(projectNameFromFile) : null;

    // Create prefilled transaction object
    const transactionData = {
      company_id: companyId,
      date: extracted.date || new Date().toISOString().split('T')[0],
      type: extracted.transactionType || 'expense',
      description: extracted.description || fileName.replace(/\[.*?\]/g, '').trim() || 'Transação importada',
      entity_name: extracted.entityName || 'Desconhecido',
      amount_net: netAmount,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      payment_method: 'bank_transfer',
      category: 'other',
      invoice_number: extracted.invoiceNumber || null,
      project_id: matchedProject?.id || null,
    };

    setPrefilledTransaction(transactionData);
    setTransactionDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setTransactionDialogOpen(open);
    if (!open) {
      setPrefilledTransaction(null);
      setUploadedFile(null);
      // Reset analysis after dialog closes
      resetAnalysis();
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const extractPdfText = async (file: File): Promise<string> => {
    try {
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      const maxPages = Math.min(pdf.numPages, 10); // Limit to first 10 pages
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }
      
      console.log(`Extracted ${fullText.length} characters from PDF`);
      return fullText;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      return `[Erro ao extrair texto do PDF: ${file.name}]`;
    }
  };

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setFileName(file.name);
    setUploadedFile(file);

    try {
      let content = "";

      // Handle different file types
      if (file.type === "application/pdf") {
        // Extract text from PDF
        content = await extractPdfText(file);
        if (!content || content.length < 50) {
          content = `[PDF File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)} KB] - Não foi possível extrair texto.`;
        }
      } else if (file.type.startsWith("text/") || 
                 file.name.endsWith(".txt") || 
                 file.name.endsWith(".csv") ||
                 file.name.endsWith(".json")) {
        content = await readFileAsText(file);
      } else if (file.type.includes("spreadsheet") || 
                 file.name.endsWith(".xlsx") || 
                 file.name.endsWith(".xls")) {
        content = `[Excel File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)} KB]
        
Note: This is an Excel spreadsheet. Please analyze based on the filename.`;
      } else {
        content = `[File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(2)} KB]`;
      }

      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { fileContent: content, fileName: file.name }
      });

      if (error) throw error;

      setAnalysis(data);
      toast.success("Documento analisado com sucesso!");
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast.error("Erro ao analisar documento");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      analyzeDocument(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      analyzeDocument(files[0]);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "loan": return "Empréstimo";
      case "transaction": return "Transação";
      default: return "Desconhecido";
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    switch (type) {
      case "loan":
        return <Badge className="bg-purple-500 text-white">Empréstimo</Badge>;
      case "transaction":
        return <Badge className="bg-blue-500 text-white">Transação</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setFileName("");
  };

  // Get matched project info for display
  const matchedProjectInfo = useMemo(() => {
    if (!fileName) return null;
    const projectNameFromFile = extractProjectFromFilename(fileName);
    if (!projectNameFromFile) return null;
    const matched = findMatchingProject(projectNameFromFile);
    return {
      searchTerm: projectNameFromFile,
      matchedProject: matched,
    };
  }, [fileName, expenseProjects]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Análise de Documentos</h2>
        <p className="text-muted-foreground">
          Arraste um documento para identificar automaticamente se é um empréstimo ou transação
        </p>
      </div>

      {/* Drop Zone */}
      <Card>
        <CardContent className="p-8">
          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              block border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 relative
              ${isDragging 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }
              ${isAnalyzing ? "opacity-50 pointer-events-none" : "cursor-pointer"}
            `}
          >
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div>
                  <p className="text-lg font-medium">A analisar documento...</p>
                  <p className="text-sm text-muted-foreground">{fileName}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    Arraste um documento aqui
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou clique para selecionar
                  </p>
                </div>
              </div>
            )}
            <input
              type="file"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.txt,.csv,.xlsx,.xls,.json,.doc,.docx"
            />
          </label>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resultado da Análise
              </CardTitle>
              <Button variant="outline" size="sm" onClick={resetAnalysis}>
                Nova Análise
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Type */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {analysis.documentType === "unknown" ? (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <span className="font-medium">Tipo de Documento:</span>
              </div>
              {getDocumentTypeBadge(analysis.documentType)}
              <span className="text-sm text-muted-foreground">
                ({Math.round(analysis.confidence * 100)}% confiança)
              </span>
            </div>

            {/* Matched Project Info */}
            {matchedProjectInfo && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Projeto detetado no nome do ficheiro</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">[{matchedProjectInfo.searchTerm}]</Badge>
                  {matchedProjectInfo.matchedProject ? (
                    <span className="text-sm text-green-600 font-medium">
                      → {matchedProjectInfo.matchedProject.name}
                    </span>
                  ) : (
                    <span className="text-sm text-yellow-600">
                      Nenhum projeto encontrado
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Resumo</p>
              <p className="text-sm">{analysis.summary}</p>
            </div>

            {/* Extracted Data */}
            {analysis.extractedData && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Dados Extraídos</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {analysis.extractedData.amount != null && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="font-semibold">{formatCurrency(analysis.extractedData.amount)}</p>
                    </div>
                  )}
                  {analysis.extractedData.date && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="font-semibold">{new Date(analysis.extractedData.date).toLocaleDateString("pt-PT")}</p>
                    </div>
                  )}
                  {analysis.extractedData.entityName && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Entidade</p>
                      <p className="font-semibold">{analysis.extractedData.entityName}</p>
                    </div>
                  )}
                  {analysis.extractedData.transactionType && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-semibold">
                        {analysis.extractedData.transactionType === "income" ? "Receita" : "Despesa"}
                      </p>
                    </div>
                  )}
                  {analysis.extractedData.lender && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Credor</p>
                      <p className="font-semibold">{analysis.extractedData.lender}</p>
                    </div>
                  )}
                  {analysis.extractedData.borrower && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Devedor</p>
                      <p className="font-semibold">{analysis.extractedData.borrower}</p>
                    </div>
                  )}
                  {analysis.extractedData.interestRate != null && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Taxa de Juro</p>
                      <p className="font-semibold">{analysis.extractedData.interestRate}%</p>
                    </div>
                  )}
                  {analysis.extractedData.invoiceNumber && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Nº Fatura</p>
                      <p className="font-semibold">{analysis.extractedData.invoiceNumber}</p>
                    </div>
                  )}
                </div>

                {/* Expense Items */}
                {analysis.extractedData.expenseItems && analysis.extractedData.expenseItems.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Itens de Despesa Detetados</p>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Fornecedor</th>
                            <th className="text-left p-2 font-medium">Descrição</th>
                            <th className="text-right p-2 font-medium">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.extractedData.expenseItems.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{item.supplier}</td>
                              <td className="p-2 text-muted-foreground">{item.description}</td>
                              <td className="p-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reasoning */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Raciocínio</p>
              <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
            </div>

            {/* Action Buttons */}
            {analysis.documentType !== "unknown" && companyId && (
              <div className="flex gap-3 pt-4 border-t">
                {analysis.documentType === "transaction" && (
                  <Button 
                    className="flex-1" 
                    onClick={handleCreateTransaction}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Criar Transação
                  </Button>
                )}
                {analysis.documentType === "loan" && (
                  <Button className="flex-1" disabled>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Criar Empréstimo (Em desenvolvimento)
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction Dialog */}
      {companyId && (
        <TransactionDialog
          open={transactionDialogOpen}
          onOpenChange={handleDialogClose}
          companyId={companyId}
          transaction={prefilledTransaction}
          initialFile={uploadedFile}
        />
      )}
    </div>
  );
}
