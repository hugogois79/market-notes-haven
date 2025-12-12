import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const createTransactionMutation = useMutation({
    mutationFn: async (analysisData: DocumentAnalysis) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizador não autenticado");
      if (!companyId) throw new Error("Empresa não selecionada");

      const extracted = analysisData.extractedData;
      const totalAmount = extracted.amount || 0;
      const vatRate = 23; // Default VAT rate
      const netAmount = totalAmount / (1 + vatRate / 100);
      const vatAmount = totalAmount - netAmount;

      const transactionData = {
        company_id: companyId,
        created_by: user.id,
        date: extracted.date || new Date().toISOString().split('T')[0],
        type: (extracted.transactionType || 'expense') as 'income' | 'expense',
        description: extracted.description || fileName || 'Transação importada',
        entity_name: extracted.entityName || 'Desconhecido',
        amount_net: netAmount,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        payment_method: 'bank_transfer' as const,
        category: 'other' as const,
        invoice_number: extracted.invoiceNumber || null,
      };

      const { error } = await supabase
        .from("financial_transactions")
        .insert([transactionData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-dashboard"] });
      toast.success("Transação criada com sucesso!");
      resetAnalysis();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar transação: " + error.message);
    },
  });

  const handleCreateTransaction = () => {
    if (!analysis) return;
    setIsCreating(true);
    createTransactionMutation.mutate(analysis);
    setIsCreating(false);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setFileName(file.name);

    try {
      let content = "";

      // Handle different file types
      if (file.type === "application/pdf") {
        // For PDFs, we'll send a message that we can't read the full content
        content = `[PDF File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)} KB]
        
Note: This is a PDF file. Please analyze based on the filename and any metadata available. 
For full PDF analysis, the file should be converted to text first.`;
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
                    disabled={isCreating || createTransactionMutation.isPending}
                  >
                    {createTransactionMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
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
    </div>
  );
}
