import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Download, Eye, X, Printer, Undo2, Pencil, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PdfViewer } from "@/components/PdfViewer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { expenseClaimService } from "@/services/expenseClaimService";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import companyLogo from "@/assets/syc-logo.png";
import { useUserRole } from "@/hooks/useUserRole";

const ExpenseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; type: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [cancellingSubmission, setCancellingSubmission] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(false);

  const { data: claim, isLoading: loadingClaim } = useQuery({
    queryKey: ["expense-claim", id],
    queryFn: () => expenseClaimService.getExpenseClaimById(id!),
    enabled: !!id,
  });

  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses", id],
    queryFn: () => expenseClaimService.getExpenses(id!),
    enabled: !!id,
  });

  const { data: requester } = useQuery({
    queryKey: ["requester", claim?.requester_id],
    queryFn: async () => {
      if (!claim?.requester_id) return null;
      const { data, error } = await supabase
        .from("expense_users")
        .select("*")
        .eq("id", claim.requester_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!claim?.requester_id,
  });

  const { data: projects } = useQuery({
    queryKey: ["expense-projects", expenses],
    queryFn: async () => {
      if (!expenses || expenses.length === 0) return [];
      const projectIds = [...new Set(expenses.map(e => e.project_id).filter(Boolean))];
      if (projectIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("expense_projects")
        .select("*")
        .in("id", projectIds);
      if (error) throw error;
      return data;
    },
    enabled: !!expenses && expenses.length > 0,
  });

  const { data: categories } = useQuery({
    queryKey: ["expense-categories", expenses],
    queryFn: async () => {
      if (!expenses || expenses.length === 0) return [];
      const categoryIds = [...new Set(expenses.map(e => e.category_id).filter(Boolean))];
      if (categoryIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("expense_categories")
        .select("id, name, color")
        .in("id", categoryIds);
      if (error) throw error;
      return data;
    },
    enabled: !!expenses && expenses.length > 0,
  });

  const handleCancelSubmission = async () => {
    if (!id) return;
    setCancellingSubmission(true);
    try {
      await expenseClaimService.cancelSubmission(id);
      queryClient.invalidateQueries({ queryKey: ["expense-claim", id] });
      toast({
        title: "Submissão anulada",
        description: "A requisição voltou ao estado de rascunho.",
      });
    } catch (error) {
      console.error("Error cancelling submission:", error);
      toast({
        title: "Erro",
        description: "Não foi possível anular a submissão.",
        variant: "destructive",
      });
    } finally {
      setCancellingSubmission(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setProcessingStatus(true);
    try {
      await expenseClaimService.approveExpenseClaim(id);
      queryClient.invalidateQueries({ queryKey: ["expense-claim", id] });
      toast({
        title: "Requisição aprovada",
        description: "A requisição foi aprovada com sucesso.",
      });
    } catch (error) {
      console.error("Error approving claim:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a requisição.",
        variant: "destructive",
      });
    } finally {
      setProcessingStatus(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setProcessingStatus(true);
    try {
      await expenseClaimService.rejectExpenseClaim(id);
      queryClient.invalidateQueries({ queryKey: ["expense-claim", id] });
      toast({
        title: "Requisição rejeitada",
        description: "A requisição foi rejeitada.",
      });
    } catch (error) {
      console.error("Error rejecting claim:", error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a requisição.",
        variant: "destructive",
      });
    } finally {
      setProcessingStatus(false);
    }
  };

  const handleViewReceipt = async (url: string) => {
    setLoadingPreview(true);
    setPreviewError(null);
    setViewingReceipt(null);
    
    try {
      console.log("=== Starting receipt view ===");
      console.log("Original URL:", url);
      
      const filePath = expenseClaimService.getFilePathFromUrl(url);
      console.log("Extracted file path:", filePath);
      
      if (!filePath) {
        const errorMsg = "Não foi possível obter o caminho do ficheiro";
        setPreviewError(errorMsg);
        toast({
          title: "Erro",
          description: errorMsg,
          variant: "destructive",
        });
        setLoadingPreview(false);
        return;
      }

      console.log("Attempting to download from bucket 'expense-receipts', path:", filePath);
      
      // Download the file and create blob URL
      const { data, error } = await supabase.storage
        .from('expense-receipts')
        .download(filePath);

      if (error) {
        console.error("Supabase storage error:", error);
        setPreviewError(`Erro ao carregar ficheiro: ${error.message}`);
        throw error;
      }

      if (!data) {
        const errorMsg = "Ficheiro não encontrado";
        console.error("No data returned from storage");
        setPreviewError(errorMsg);
        throw new Error(errorMsg);
      }

      console.log("Downloaded file successfully:", {
        type: data.type,
        size: data.size,
        sizeKB: (data.size / 1024).toFixed(2) + " KB"
      });
      
      const blobUrl = URL.createObjectURL(data);
      const fileType = data.type || 'application/octet-stream';
      
      console.log("Created blob URL:", blobUrl);
      console.log("File type:", fileType);
      console.log("=== Receipt view successful ===");

      setViewingReceipt({ url: blobUrl, type: fileType });
      setLoadingPreview(false);
    } catch (error) {
      console.error("=== Error viewing receipt ===", error);
      const errorMsg = error instanceof Error ? error.message : "Não foi possível visualizar o ficheiro";
      setPreviewError(errorMsg);
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
      setLoadingPreview(false);
    }
  };

  const handleDownloadReceipt = async (url: string) => {
    try {
      const filePath = expenseClaimService.getFilePathFromUrl(url);
      if (!filePath) {
        toast({
          title: "Erro",
          description: "Não foi possível obter o caminho do ficheiro",
          variant: "destructive",
        });
        return;
      }

      const fileName = filePath.split('/').pop() || 'recibo.pdf';
      await expenseClaimService.downloadReceipt(filePath, fileName);
      
      toast({
        title: "Download iniciado",
        description: "O ficheiro está a ser transferido",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer download do ficheiro",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async () => {
    if (!claim) return;

    toast({
      title: "A preparar impressão...",
      description: "Por favor aguarde enquanto os dados são carregados",
    });

    try {
      let receipts: { expense: any; images: string[]; type: string }[] = [];

      // Only process receipts if expenses exist
      if (expenses && expenses.length > 0) {
        const expensesWithReceipts = expenses.filter(expense => expense.receipt_image_url);
        console.log('Expenses with receipts:', expensesWithReceipts.length);
        
        if (expensesWithReceipts.length > 0) {
          // Dynamically import pdf.js
          const pdfjsLib = await import('pdfjs-dist');
          
          // Set up the worker using Vite's ?url import for proper bundling
          const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;

          // Process all receipts
          const receiptPromises = expensesWithReceipts.map(async (expense) => {
            console.log('Processing receipt for expense:', expense.description, expense.receipt_image_url);
            const filePath = expenseClaimService.getFilePathFromUrl(expense.receipt_image_url!);
            console.log('Extracted file path:', filePath);
            
            if (!filePath) {
              console.error('Failed to extract file path from URL');
              return null;
            }

            const { data, error } = await supabase.storage
              .from('expense-receipts')
              .download(filePath);

            if (error) {
              console.error('Error downloading receipt:', error.message);
              return null;
            }
            
            if (!data) {
              console.error('No data returned from storage');
              return null;
            }

            console.log('Downloaded file type:', data.type, 'size:', data.size);

            // Handle images directly - convert to base64 data URL
            if (data.type.startsWith('image/')) {
              console.log('Processing image file...');
              try {
                // Convert blob to base64 data URL (works across windows)
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(data);
                });
                console.log('Created image data URL');
                return {
                  expense,
                  images: [dataUrl],
                  type: 'image',
                };
              } catch (imgError) {
                console.error('Error processing image:', imgError);
                return null;
              }
            }

            // Handle PDFs - convert each page to image
            if (data.type === 'application/pdf') {
              console.log('Processing PDF file...');
              try {
                const arrayBuffer = await data.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                console.log('PDF loaded, pages:', pdf.numPages);
                const images: string[] = [];

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                  try {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 2.0 });
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    if (!context) {
                      console.error('Failed to get canvas context');
                      continue;
                    }
                    
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                      canvasContext: context,
                      viewport: viewport,
                      canvas: canvas,
                    }).promise;

                    const imageData = canvas.toDataURL('image/png');
                    images.push(imageData);
                    console.log(`PDF page ${pageNum} rendered successfully`);
                  } catch (pageError) {
                    console.error(`Error processing PDF page ${pageNum}:`, pageError);
                  }
                }

                console.log('Total images from PDF:', images.length);
                if (images.length > 0) {
                  return {
                    expense,
                    images,
                    type: 'pdf',
                  };
                }
              } catch (pdfError) {
                console.error('Error processing PDF:', pdfError);
                return null;
              }
            }

            console.warn('Unknown file type:', data.type);
            return null;
          });

          receipts = (await Promise.all(receiptPromises)).filter(Boolean) as { expense: any; images: string[]; type: string }[];
          console.log('Total receipts processed:', receipts.length);
        }
      }

      toast({
        title: "Pronto para impressão",
        description: receipts.length > 0 ? `Requisição + ${receipts.length} comprovativo(s)` : "Requisição sem comprovativos",
      });

      // Generate print HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Erro",
          description: "Por favor permita pop-ups para imprimir",
          variant: "destructive",
        });
        return;
      }

      // Convert logo to base64 for print
      const logoBase64 = await fetch(companyLogo)
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }))
        .catch(() => '');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Requisição de Despesas #${claim.claim_number}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
              
              * { margin: 0; padding: 0; box-sizing: border-box; }
              
              body { 
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
                background: #ffffff;
                color: #1a1a2e;
                font-size: 13px;
                line-height: 1.6;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .page { 
                background: white;
                max-width: 850px;
                margin: 0 auto;
                padding: 48px;
                min-height: 100vh;
              }
              
              .page.has-receipts {
                page-break-after: always;
              }
              
              /* Elegant Header */
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                padding-bottom: 32px;
                border-bottom: 2px solid #f0f0f5;
              }
              
              .header-left {
                display: flex;
                flex-direction: column;
                gap: 16px;
              }
              
              .header-logo img {
                height: 48px;
                width: auto;
              }
              
              .document-title {
                margin-top: 8px;
              }
              
              .document-title h1 {
                font-size: 28px;
                font-weight: 800;
                color: #1a1a2e;
                letter-spacing: -0.5px;
              }
              
              .document-title .doc-number {
                font-size: 14px;
                font-weight: 500;
                color: #6b7280;
                margin-top: 4px;
              }
              
              .header-right {
                text-align: right;
              }
              
              .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border-radius: 50px;
                font-weight: 700;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .status-pending { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #78350f; }
              .status-approved { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; }
              .status-submitted { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
              .status-draft { background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%); color: white; }
              
              /* Info Cards Grid */
              .info-section {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 32px;
              }
              
              .info-card {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border-radius: 16px;
                padding: 20px;
                position: relative;
                overflow: hidden;
              }
              
              .info-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
                border-radius: 4px 0 0 4px;
              }
              
              .info-card-label {
                font-size: 10px;
                font-weight: 700;
                color: #6366f1;
                text-transform: uppercase;
                letter-spacing: 1.2px;
                margin-bottom: 8px;
              }
              
              .info-card-value {
                font-size: 15px;
                font-weight: 700;
                color: #1a1a2e;
              }
              
              /* Description */
              .description-section {
                background: #fafbfc;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 32px;
              }
              
              .description-section h3 {
                font-size: 11px;
                font-weight: 700;
                color: #6366f1;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
              }
              
              .description-section p {
                color: #374151;
                font-size: 14px;
                line-height: 1.7;
              }
              
              /* Modern Table */
              .table-container {
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
                margin-bottom: 32px;
              }
              
              .table-header {
                background: #eff6ff;
                padding: 14px 20px;
                color: #1e40af;
                border-left: 4px solid #3b82f6;
              }
              
              .table-header h2 {
                font-size: 14px;
                font-weight: 700;
                letter-spacing: -0.3px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                background: white;
              }
              
              table th {
                background: #f8fafc;
                padding: 10px 16px;
                text-align: left;
                font-size: 9px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                border-bottom: 1px solid #e2e8f0;
              }
              
              table td {
                padding: 10px 16px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 12px;
                color: #374151;
              }
              
              table tr:last-child td {
                border-bottom: none;
              }
              
              table tr:nth-child(even) {
                background: #fafbfc;
              }
              
              .expense-description {
                font-weight: 600;
                color: #1a1a2e;
              }
              
              .expense-supplier {
                color: #6b7280;
                font-size: 12px;
              }
              
              .amount-cell {
                font-weight: 700;
                color: #1a1a2e;
                font-size: 13px;
                font-variant-numeric: tabular-nums;
              }
              
              .amount-highlight {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                padding: 6px 12px;
                border-radius: 8px;
                color: #92400e;
              }
              
              .receipt-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 10px;
                font-weight: 600;
                padding: 4px 10px;
                border-radius: 12px;
              }
              
              .receipt-attached {
                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                color: #065f46;
              }
              
              .receipt-missing {
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                color: #991b1b;
              }
              
              /* Summary Section */
              .summary-wrapper {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 40px;
              }
              
              .summary-card {
                background: #eff6ff;
                border-radius: 16px;
                padding: 20px 28px;
                color: #1e3a5f;
                min-width: 280px;
                border-left: 4px solid #3b82f6;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
              }
              
              .summary-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
              }
              
              .summary-row.border-bottom {
                border-bottom: 1px solid rgba(59, 130, 246, 0.2);
                margin-bottom: 8px;
                padding-bottom: 12px;
              }
              
              .summary-label {
                font-size: 12px;
                color: #64748b;
                font-weight: 500;
              }
              
              .summary-value {
                font-size: 14px;
                font-weight: 700;
                color: #1e40af;
                font-variant-numeric: tabular-nums;
              }
              
              .summary-row.grand-total {
                margin-top: 6px;
                padding-top: 12px;
                border-top: 2px solid rgba(59, 130, 246, 0.3);
              }
              
              .summary-row.grand-total .summary-label {
                font-size: 14px;
                font-weight: 700;
                color: #1e3a5f;
              }
              
              .summary-row.grand-total .summary-value {
                font-size: 24px;
                font-weight: 800;
                color: #1e40af;
              }
              
              /* Footer */
              .page-footer {
                margin-top: auto;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                color: #9ca3af;
              }
              
              .footer-brand {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
              }
              
              .footer-brand img {
                height: 20px;
                opacity: 0.6;
              }
              
              /* Receipt Pages */
              .receipt-page {
                background: white;
                max-width: 850px;
                margin: 0 auto;
                padding: 48px;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
              }
              
              .receipt-page:not(:last-child) {
                page-break-after: always;
              }
              
              .receipt-header {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-radius: 20px;
                padding: 24px 32px;
                margin-bottom: 32px;
                color: #1e40af;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 4px 12px rgba(30, 64, 175, 0.1);
              }
              
              .receipt-header h2 {
                font-size: 18px;
                font-weight: 700;
                color: #1e40af;
              }
              
              .receipt-meta {
                background: rgba(30, 64, 175, 0.1);
                padding: 8px 16px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                color: #1e40af;
              }
              
              .receipt-content {
                flex: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                background: #f8fafc;
                border-radius: 16px;
                padding: 24px;
              }
              
              .receipt-content img {
                max-width: 100%;
                max-height: 70vh;
                object-fit: contain;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
              }
              
              @media print {
                body { background: white; }
                .page, .receipt-page { 
                  padding: 32px; 
                  box-shadow: none;
                  max-width: 100%;
                }
                .summary-row.grand-total .summary-value {
                  color: #1e40af;
                  -webkit-text-fill-color: #1e40af;
                }
              }
            </style>
          </head>
          <body>
            <!-- First Page: Summary -->
            <div class="page${receipts.length > 0 ? ' has-receipts' : ''}">
              <div class="header">
                <div class="header-left">
                  <div class="header-logo">
                    ${logoBase64 ? `<img src="${logoBase64}" alt="Sustainable Yield Capital" />` : '<span style="font-size: 24px; font-weight: 800; color: #1a1a2e;">SYC</span>'}
                  </div>
                  <div class="document-title">
                    <h1>Requisição de Despesas</h1>
                    <div class="doc-number">Nº ${claim.claim_number} · ${format(new Date(claim.claim_date), "dd/MM/yyyy")}</div>
                  </div>
                </div>
                <div class="header-right">
                  <span class="status-badge status-${getStatusClass(claim.status)}">
                    ${getStatusLabel(claim.status)}
                  </span>
                </div>
              </div>

              <div class="info-section">
                <div class="info-card">
                  <div class="info-card-label">Requisitante</div>
                  <div class="info-card-value">${requester?.name || "-"}</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Projeto</div>
                  <div class="info-card-value">${projects && projects.length > 0 ? projects[0].name : "-"}</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Data</div>
                  <div class="info-card-value">${format(new Date(claim.claim_date), "dd/MM/yyyy")}</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Tipo</div>
                  <div class="info-card-value">${claim.claim_type === "reembolso" ? "Reembolso" : "Cartão Crédito"}</div>
                </div>
              </div>

              ${claim.description ? `
                <div class="description-section">
                  <h3>Descrição</h3>
                  <p>${claim.description}</p>
                </div>
              ` : ''}

              <div class="table-container">
                <div class="table-header">
                  <h2>Itens de Despesa</h2>
                </div>
                ${expenses && expenses.length > 0 ? `
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 100px;">Data</th>
                        <th>Descrição</th>
                        <th>Fornecedor</th>
                        <th style="text-align: center; width: 100px;">Recibo</th>
                        <th style="text-align: right; width: 120px;">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${expenses.map(expense => {
                        const amount = Number(expense.amount);
                        const isHighAmount = amount > 1000;
                        return `
                          <tr>
                            <td>${format(new Date(expense.expense_date), "dd/MM/yyyy")}</td>
                            <td>
                              <div class="expense-description">${expense.description}</div>
                            </td>
                            <td class="expense-supplier">${expense.supplier}</td>
                            <td style="text-align: center;">
                              <span class="receipt-badge ${expense.receipt_image_url ? 'receipt-attached' : 'receipt-missing'}">
                                ${expense.receipt_image_url ? '✓ Anexado' : '✗ Em falta'}
                              </span>
                            </td>
                            <td style="text-align: right;">
                              <span class="amount-cell ${isHighAmount ? 'amount-highlight' : ''}">
                                ${formatCurrency(amount)}
                              </span>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                ` : `
                  <div style="padding: 48px; text-align: center; color: #9ca3af; font-size: 14px;">
                    Sem despesas registadas
                  </div>
                `}
              </div>

              <div class="summary-wrapper">
                <div class="summary-card">
                  <div class="summary-row border-bottom">
                    <span class="summary-label">Subtotal</span>
                    <span class="summary-value">${formatCurrency(Number(claim.total_amount))}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">IVA</span>
                    <span class="summary-value">€ 0,00</span>
                  </div>
                  <div class="summary-row grand-total">
                    <span class="summary-label">Total</span>
                    <span class="summary-value">${formatCurrency(Number(claim.total_amount))}</span>
                  </div>
                </div>
              </div>

              <div class="page-footer">
                <div class="footer-brand">
                  Sustainable Yield Capital
                </div>
                <div>
                  ${format(new Date(), "dd/MM/yyyy HH:mm")} · Página 1 de ${1 + receipts.reduce((acc, r) => acc + r.images.length, 0)}
                </div>
              </div>
            </div>

            <!-- Following Pages: Individual Receipts -->
            ${receipts.flatMap((receipt, receiptIndex) => 
              receipt.images.map((imageUrl, pageIndex) => `
                <div class="receipt-page">
                  <div class="receipt-header">
                    <h2>Comprovativo ${receiptIndex + 1}${receipt.images.length > 1 ? ` · Pág. ${pageIndex + 1}` : ''}: ${receipt.expense.description}</h2>
                    <span class="receipt-meta">${receipt.expense.supplier} · ${formatCurrency(Number(receipt.expense.amount))}</span>
                  </div>
                  <div class="receipt-content">
                    <img src="${imageUrl}" alt="Comprovativo ${receiptIndex + 1}" />
                  </div>
                  <div class="page-footer">
                    <div class="footer-brand">
                      Sustainable Yield Capital
                    </div>
                    <div>
                      Requisição #${claim.claim_number} · Comprovativo ${receiptIndex + 1}${receipt.images.length > 1 ? ` Pág. ${pageIndex + 1}` : ''}
                    </div>
                  </div>
                </div>
              `)
            ).join('')}

            <script>
              window.onafterprint = function() {
                ${receipts.flatMap(r => r.images.filter(url => url.startsWith('blob:')).map(url => `URL.revokeObjectURL('${url}');`)).join('\n')}
                window.close();
              };

              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

    } catch (error) {
      console.error("Error preparing print:", error);
      toast({
        title: "Erro",
        description: "Não foi possível preparar a impressão",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      rascunho: "bg-gray-500",
      submetido: "bg-blue-500",
      aprovado: "bg-green-500",
      pago: "bg-emerald-500",
      rejeitado: "bg-red-500",
    };

    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      submetido: "Submetido",
      aprovado: "Aprovado",
      pago: "Pago",
      rejeitado: "Rejeitado",
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === "reembolso") return "Reembolso de Despesas";
    if (type === "transferencia_bancaria") return "Transferência Bancária";
    if (type === "logbook") return "Logbook";
    if (type === "deslocacoes") return "Deslocações";
    return "Justificação de Cartão de Crédito";
  };

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      rascunho: "draft",
      submetido: "submitted",
      aprovado: "approved",
      pago: "approved",
      rejeitado: "pending",
    };
    return classes[status] || "draft";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      rascunho: "Draft",
      submetido: "Submitted",
      aprovado: "Approved",
      pago: "Paid",
      rejeitado: "Rejected",
    };
    return labels[status] || status;
  };

  if (loadingClaim || loadingExpenses) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Requisição não encontrada</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/expenses")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            Requisição #{claim.claim_number}
          </h1>
          <p className="text-muted-foreground mt-1">
            Detalhes da requisição de despesas
          </p>
        </div>
        <div className="flex gap-2">
          {claim.status === "submetido" && (
            <>
              {isAdmin && (
                <>
                  <Button 
                    onClick={handleApprove} 
                    disabled={processingStatus}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {processingStatus ? "A processar..." : "Aprovar"}
                  </Button>
                  <Button 
                    onClick={handleReject} 
                    variant="destructive"
                    disabled={processingStatus}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {processingStatus ? "A processar..." : "Rejeitar"}
                  </Button>
                </>
              )}
              <Button 
                onClick={handleCancelSubmission} 
                variant="outline"
                disabled={cancellingSubmission}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                {cancellingSubmission ? "A anular..." : "Anular Submissão"}
              </Button>
              <Button onClick={handlePrint} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </>
          )}
          {claim.status === "aprovado" && (
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          )}
          {claim.status === "rascunho" && (
            <Button onClick={() => navigate(`/expenses/${id}/edit`)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{getTypeBadge(claim.claim_type)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(claim.status)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data Criação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {format(new Date(claim.claim_date), "dd/MM/yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data Submissão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {claim.submission_date
                ? format(new Date(claim.submission_date), "dd/MM/yyyy")
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Requisitante</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{requester?.name || "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {projects && projects.length > 0 ? projects[0].name : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {claim.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{claim.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {!expenses || expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma despesa adicionada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="py-1 text-xs">Data</TableHead>
                  <TableHead className="py-1 text-xs">Descrição</TableHead>
                  <TableHead className="py-1 text-xs">Fornecedor</TableHead>
                  <TableHead className="py-1 text-xs">Categoria</TableHead>
                  <TableHead className="py-1 text-xs">Valor</TableHead>
                  <TableHead className="py-1 text-xs">Comprovativo</TableHead>
                  {claim.status === "rascunho" && <TableHead className="w-[50px] py-1"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const category = categories?.find(c => c.id === expense.category_id);
                  return (
                    <TableRow key={expense.id} className="h-8">
                      <TableCell className="py-1 text-sm">
                        {format(new Date(expense.expense_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="py-1 text-sm">{expense.description}</TableCell>
                      <TableCell className="py-1 text-sm">{expense.supplier}</TableCell>
                      <TableCell className="py-1 text-sm">
                        {category ? (
                          <Badge variant="outline" style={{ borderColor: category.color, color: category.color }}>
                            {category.name}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="py-1 text-sm font-semibold">
                        {formatCurrency(Number(expense.amount))}
                      </TableCell>
                      <TableCell className="py-1">
                        {expense.receipt_image_url ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewReceipt(expense.receipt_image_url!)}
                              disabled={loadingPreview}
                              className="text-primary hover:underline h-6 px-2 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadReceipt(expense.receipt_image_url!)}
                              className="text-primary hover:underline h-6 px-2 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {claim.status === "rascunho" && (
                        <TableCell className="py-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/expenses/${id}/edit?editExpense=${expense.id}`)}
                            className="h-6 w-6 p-0"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-2xl font-bold">
            <span>Total:</span>
            <span className="text-primary">
              {formatCurrency(Number(claim.total_amount))}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewingReceipt || loadingPreview || !!previewError} onOpenChange={() => {
        if (viewingReceipt) {
          URL.revokeObjectURL(viewingReceipt.url);
        }
        setViewingReceipt(null);
        setLoadingPreview(false);
        setPreviewError(null);
      }}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Visualizar Comprovativo
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (viewingReceipt) {
                    URL.revokeObjectURL(viewingReceipt.url);
                  }
                  setViewingReceipt(null);
                  setLoadingPreview(false);
                  setPreviewError(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center">
            {loadingPreview ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">A carregar comprovativo...</p>
              </div>
            ) : previewError ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-16 w-16 text-destructive opacity-50 mb-4" />
                <p className="text-lg font-semibold text-destructive mb-2">Erro ao carregar ficheiro</p>
                <p className="text-sm text-muted-foreground">{previewError}</p>
              </div>
            ) : viewingReceipt ? (
              viewingReceipt.type.startsWith('image/') ? (
                <img 
                  src={viewingReceipt.url} 
                  alt="Comprovativo" 
                  className="w-full h-auto object-contain"
                />
              ) : viewingReceipt.type === 'application/pdf' ? (
                <PdfViewer url={viewingReceipt.url} filename="comprovativo.pdf" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Tipo de ficheiro: {viewingReceipt.type}
                  </p>
                  <Button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = viewingReceipt.url;
                      a.download = 'comprovativo';
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descarregar Ficheiro
                  </Button>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseDetailPage;
