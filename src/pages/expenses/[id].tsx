import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Download, Eye, X, Printer } from "lucide-react";
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

const ExpenseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; type: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
        .from("expense_requesters")
        .select("*")
        .eq("id", claim.requester_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!claim?.requester_id,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", expenses],
    queryFn: async () => {
      if (!expenses || expenses.length === 0) return [];
      const projectIds = [...new Set(expenses.map(e => e.project_id).filter(Boolean))];
      if (projectIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("financial_projects")
        .select("*")
        .in("id", projectIds);
      if (error) throw error;
      return data;
    },
    enabled: !!expenses && expenses.length > 0,
  });

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
          
          // Set up the worker using Vite's import.meta.url approach
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.mjs',
            import.meta.url
          ).toString();

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

            // Handle images directly
            if (data.type.startsWith('image/')) {
              const blobUrl = URL.createObjectURL(data);
              console.log('Created image blob URL');
              return {
                expense,
                images: [blobUrl],
                type: 'image',
              };
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
            <title>Expense Request #${claim.claim_number}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              
              * { margin: 0; padding: 0; box-sizing: border-box; }
              
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                background: #f8fafc;
                color: #1e293b;
                font-size: 14px;
                line-height: 1.5;
              }
              
              .page { 
                page-break-after: always; 
                background: white;
                max-width: 900px;
                margin: 0 auto;
                padding: 40px;
              }
              
              /* Header */
              .header {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 24px 32px;
                margin-bottom: 32px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              
              .header-left {
                display: flex;
                align-items: center;
              }
              
              .header-logo {
                height: 60px;
              }
              
              .header-logo img {
                height: 100%;
                width: auto;
              }
              
              .header-info h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 4px;
              }
              
              .header-info p {
                opacity: 0.8;
                font-size: 14px;
              }
              
              .header-right {
                text-align: right;
              }
              
              .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              .status-pending { background: #fbbf24; color: #78350f; }
              .status-approved { background: #22c55e; color: white; }
              .status-submitted { background: #3b82f6; color: white; }
              .status-draft { background: #94a3b8; color: white; }
              
              .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: currentColor;
              }
              
              /* Info Grid */
              .info-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 16px;
                margin-bottom: 24px;
              }
              
              .info-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 16px 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              }
              
              .info-card-label {
                font-size: 11px;
                font-weight: 600;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
              }
              
              .info-card-value {
                font-size: 16px;
                font-weight: 600;
                color: #0f172a;
              }
              
              /* Description Section */
              .description-card {
                background: #f1f5f9;
                border-radius: 12px;
                padding: 20px 24px;
                margin-bottom: 24px;
              }
              
              .description-card h3 {
                font-size: 12px;
                font-weight: 600;
                color: #64748b;
                text-transform: uppercase;
                margin-bottom: 8px;
              }
              
              .description-card p {
                color: #334155;
                font-size: 15px;
              }
              
              /* Expenses Table */
              .table-section {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                overflow: hidden;
                margin-bottom: 24px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              }
              
              .table-header {
                background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
                padding: 16px 24px;
                color: white;
                font-weight: 600;
                font-size: 16px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
              }
              
              table th {
                background: #f8fafc;
                padding: 14px 16px;
                text-align: left;
                font-size: 11px;
                font-weight: 700;
                color: #475569;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 2px solid #e2e8f0;
              }
              
              table td {
                padding: 16px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 14px;
                color: #334155;
              }
              
              table tr:last-child td {
                border-bottom: none;
              }
              
              table tr:hover {
                background: #f8fafc;
              }
              
              .amount-cell {
                font-weight: 700;
                color: #0f172a;
                font-size: 15px;
              }
              
              .amount-high {
                color: #dc2626;
                background: #fef2f2;
                padding: 4px 8px;
                border-radius: 4px;
              }
              
              .receipt-indicator {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 4px;
              }
              
              .has-receipt {
                background: #dcfce7;
                color: #166534;
              }
              
              .no-receipt {
                background: #fef3c7;
                color: #92400e;
              }
              
              /* Summary Card */
              .summary-section {
                display: flex;
                justify-content: flex-end;
              }
              
              .summary-card {
                background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0891b2 100%);
                border-radius: 16px;
                padding: 24px 32px;
                color: white;
                min-width: 320px;
              }
              
              .summary-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
              }
              
              .summary-row.subtotal {
                border-bottom: 1px solid rgba(255,255,255,0.2);
                margin-bottom: 8px;
                padding-bottom: 12px;
              }
              
              .summary-label {
                font-size: 14px;
                opacity: 0.8;
              }
              
              .summary-value {
                font-size: 16px;
                font-weight: 600;
              }
              
              .summary-row.total .summary-label {
                font-size: 18px;
                font-weight: 600;
                opacity: 1;
              }
              
              .summary-row.total .summary-value {
                font-size: 28px;
                font-weight: 700;
              }
              
              /* Receipt Pages */
              .receipt-page {
                page-break-after: always;
                background: white;
                max-width: 900px;
                margin: 0 auto;
                padding: 40px;
                min-height: 100vh;
              }
              
              .receipt-header {
                background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
                border-radius: 12px;
                padding: 20px 24px;
                margin-bottom: 24px;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              
              .receipt-header h2 {
                font-size: 18px;
                font-weight: 600;
              }
              
              .receipt-header .badge {
                background: rgba(255,255,255,0.2);
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
              }
              
              .receipt-content {
                display: flex;
                justify-content: center;
                align-items: center;
                flex: 1;
              }
              
              .receipt-content img {
                max-width: 100%;
                max-height: 75vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              
              /* Footer */
              .page-footer {
                margin-top: 32px;
                padding-top: 16px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                color: #94a3b8;
              }
              
              .page-footer .brand {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .page-footer .brand img {
                height: 24px;
                opacity: 0.5;
              }
              
              @media print {
                body { background: white; }
                .page, .receipt-page { 
                  padding: 24px; 
                  box-shadow: none;
                  max-width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <!-- First Page: Summary -->
            <div class="page">
              <div class="header">
                <div class="header-left">
                  <div class="header-logo">
                    ${logoBase64 ? `<img src="${logoBase64}" alt="Sustainable Yield Capital" />` : '<span style="font-size: 24px; font-weight: 700;">SYC</span>'}
                  </div>
                </div>
                <div class="header-right">
                  <span class="status-badge status-${getStatusClass(claim.status)}">
                    <span class="status-dot"></span>
                    ${getStatusLabel(claim.status)}
                  </span>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-card">
                  <div class="info-card-label">Requester</div>
                  <div class="info-card-value">${requester?.name || "-"}</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Department / Project</div>
                  <div class="info-card-value">${projects && projects.length > 0 ? projects[0].name : "-"}</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Submission Date</div>
                  <div class="info-card-value">${claim.submission_date ? format(new Date(claim.submission_date), "dd/MM/yyyy") : format(new Date(claim.created_at), "dd/MM/yyyy")}</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Request Type</div>
                  <div class="info-card-value">${getTypeBadge(claim.claim_type)}</div>
                </div>
              </div>

              ${claim.description ? `
                <div class="description-card">
                  <h3>Description</h3>
                  <p>${claim.description}</p>
                </div>
              ` : ''}

              <div class="table-section">
                <div class="table-header">Expense Items</div>
                ${expenses && expenses.length > 0 ? `
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Supplier</th>
                        <th style="text-align: center;">Receipt</th>
                        <th style="text-align: right;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${expenses.map(expense => {
                        const amount = Number(expense.amount);
                        const isHighAmount = amount > 1000;
                        return `
                          <tr>
                            <td>${format(new Date(expense.expense_date), "dd/MM/yyyy")}</td>
                            <td><strong>${expense.description}</strong></td>
                            <td>${expense.supplier}</td>
                            <td style="text-align: center;">
                              <span class="receipt-indicator ${expense.receipt_image_url ? 'has-receipt' : 'no-receipt'}">
                                ${expense.receipt_image_url ? '✓ Attached' : '⚠ Missing'}
                              </span>
                            </td>
                            <td style="text-align: right;">
                              <span class="amount-cell ${isHighAmount ? 'amount-high' : ''}">
                                ${formatCurrency(amount)}
                              </span>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                ` : `
                  <div style="padding: 40px; text-align: center; color: #94a3b8;">
                    No expenses recorded
                  </div>
                `}
              </div>

              <div class="summary-section">
                <div class="summary-card">
                  <div class="summary-row subtotal">
                    <span class="summary-label">Subtotal (Net)</span>
                    <span class="summary-value">${formatCurrency(Number(claim.total_amount))}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">VAT</span>
                    <span class="summary-value">€ 0.00</span>
                  </div>
                  <div class="summary-row total">
                    <span class="summary-label">Grand Total</span>
                    <span class="summary-value">${formatCurrency(Number(claim.total_amount))}</span>
                  </div>
                </div>
              </div>

              <div class="page-footer">
                <div class="brand">
                  <span>Generated by Sustainable Yield Capital</span>
                </div>
                <div>
                  ${format(new Date(), "dd/MM/yyyy HH:mm")} · Page 1 of ${1 + receipts.reduce((acc, r) => acc + r.images.length, 0)}
                </div>
              </div>
            </div>

            <!-- Following Pages: Individual Receipts -->
            ${receipts.flatMap((receipt, receiptIndex) => 
              receipt.images.map((imageUrl, pageIndex) => `
                <div class="receipt-page">
                  <div class="receipt-header">
                    <h2>Receipt ${receiptIndex + 1}${receipt.images.length > 1 ? ` - Page ${pageIndex + 1}` : ''}: ${receipt.expense.description}</h2>
                    <span class="badge">${receipt.expense.supplier} · ${formatCurrency(Number(receipt.expense.amount))}</span>
                  </div>
                  <div class="receipt-content">
                    <img src="${imageUrl}" alt="Receipt ${receiptIndex + 1}" />
                  </div>
                  <div class="page-footer">
                    <div class="brand">
                      <span>Sustainable Yield Capital</span>
                    </div>
                    <div>
                      Expense Request #${claim.claim_number} · Receipt ${receiptIndex + 1}${receipt.images.length > 1 ? ` Page ${pageIndex + 1}` : ''}
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
    return type === "reembolso" ? "Reembolso de Despesas" : "Justificação de Cartão de Crédito";
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
              {format(new Date(claim.created_at), "dd/MM/yyyy")}
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
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Comprovativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.expense_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.supplier}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(expense.amount))}
                    </TableCell>
                    <TableCell>
                      {expense.receipt_image_url ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewReceipt(expense.receipt_image_url!)}
                            disabled={loadingPreview}
                            className="text-primary hover:underline"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadReceipt(expense.receipt_image_url!)}
                            className="text-primary hover:underline"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
