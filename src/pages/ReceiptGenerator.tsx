import { useState, useEffect } from "react";
import { ArrowLeft, Printer, Save, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import DOMPurify from 'dompurify';
import { useAuth } from "@/contexts/AuthContext";
import sustainableYieldLogo from "@/assets/sustainable-yield-logo-new.png";
import epicatmosphereLogo from "@/assets/epicatmosphere-logo.png";
import { PreviousReceipts } from "@/components/ReceiptGenerator/PreviousReceipts";
import type { Receipt } from "@/services/receiptService";

interface CompanyData {
  name: string;
  nipc?: string;
  capital_social?: string;
  company_number?: string;
  address: string;
  country: string;
  email?: string;
  bank_account?: string;
  bank_name?: string;
  logo_url?: string;
}


const ReceiptGenerator = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [content, setContent] = useState("");
  const [generatedReceipt, setGeneratedReceipt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<number | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [companies, setCompanies] = useState<CompanyData[]>([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('receipt_companies')
        .select('*');
      
      if (error) {
        console.error('Error loading companies:', error);
        toast.error('Failed to load company data');
        return;
      }
      
      console.log('Loaded companies:', data);
      setCompanies(data || []);
    } catch (err) {
      console.error('Exception loading companies:', err);
    }
  };

  const getCompanyData = (companyName: string): CompanyData | null => {
    const found = companies.find(c => 
      c.name.toLowerCase().includes(companyName.toLowerCase())
    );
    console.log(`Looking for company containing "${companyName}", found:`, found);
    return found || null;
  };

  const handleLoadReceipt = (receipt: Receipt) => {
    setContent(receipt.raw_content);
    setGeneratedReceipt(receipt.formatted_content);
    setReceiptNumber(receipt.receipt_number);
    setReceiptId(receipt.id);
    setActiveTab("editor");
    toast.success(`Loaded receipt #${receipt.receipt_number}`);
  };

  const handleNewReceipt = () => {
    setContent("");
    setGeneratedReceipt("");
    setReceiptNumber(null);
    setReceiptId(null);
    toast.info("Starting new receipt");
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error("Please add some content first");
      return;
    }
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('format-receipt', {
        body: { content }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedReceipt(data.formattedReceipt);
      toast.success("Receipt formatted successfully!");
      
      // Auto-save after generating with extracted data
      if (session?.user?.id) {
        await saveReceipt(data.formattedReceipt, {
          beneficiary_name: data.beneficiary_name,
          payment_amount: data.payment_amount,
          payment_date: data.payment_date,
          payment_reference: data.payment_reference
        });
      }
    } catch (error) {
      console.error('Error formatting receipt:', error);
      toast.error("Failed to format receipt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveReceipt = async (
    formattedContent: string,
    extractedData?: {
      beneficiary_name?: string | null;
      payment_amount?: string | null;
      payment_date?: string | null;
      payment_reference?: string | null;
    }
  ) => {
    if (!session?.user?.id) return;

    setIsSaving(true);
    try {
      const receiptData: {
        user_id: string;
        raw_content: string;
        formatted_content: string;
        beneficiary_name?: string | null;
        payment_amount?: string | null;
        payment_date?: string | null;
        payment_reference?: string | null;
      } = {
        user_id: session.user.id,
        raw_content: content,
        formatted_content: formattedContent,
        beneficiary_name: extractedData?.beneficiary_name || null,
        payment_amount: extractedData?.payment_amount || null,
        payment_date: extractedData?.payment_date || null,
        payment_reference: extractedData?.payment_reference || null,
      };

      if (receiptId) {
        // Update existing receipt
        const { error } = await supabase
          .from('receipts')
          .update(receiptData)
          .eq('id', receiptId);

        if (error) throw error;
        toast.success("Receipt updated successfully!");
      } else {
        // Create new receipt
        const { data, error } = await supabase
          .from('receipts')
          .insert([receiptData] as any)
          .select('id, receipt_number')
          .single();

        if (error) throw error;
        
        setReceiptId(data.id);
        setReceiptNumber(data.receipt_number);
        toast.success(`Receipt saved with number #${data.receipt_number}`);
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast.error("Failed to save receipt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to save receipts");
      return;
    }

    if (!generatedReceipt) {
      toast.error("Please generate the receipt first");
      return;
    }

    await saveReceipt(generatedReceipt);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Check if issuer is Epicatmosphere
    const isEpicatmosphere = content.toLowerCase().includes('epicatmosphere') || 
                             generatedReceipt.toLowerCase().includes('epicatmosphere');
    
    const company = isEpicatmosphere 
      ? getCompanyData('epic atmosphere')
      : getCompanyData('sustainable yield');
    
    const logoToUse = isEpicatmosphere ? epicatmosphereLogo : sustainableYieldLogo;
    
    let companyDetails: string[] = [];
    if (company) {
      // Add Morada Registada
      if (company.address) {
        companyDetails.push(`<p style="margin: 2px 0; font-size: 10px;">Morada Registada: ${company.address}${company.country ? ', ' + company.country : ''}</p>`);
      }
      // Add Email only if provided
      if (company.email) {
        companyDetails.push(`<p style="margin: 2px 0; font-size: 10px;">Email: ${company.email}</p>`);
      }
      // Add Bank Account only if provided
      if (company.bank_account) {
        companyDetails.push(`<p style="margin: 2px 0; font-size: 10px;">Conta Bancária: ${company.bank_account}${company.bank_name ? ' (' + company.bank_name + ')' : ''}</p>`);
      }
      // Add Capital Social only if provided
      if (company.capital_social) {
        companyDetails.push(`<p style="margin: 2px 0; font-size: 10px;">Capital Social: ${company.capital_social}</p>`);
      }
    }
    const companyAddress = companyDetails.join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            @media print {
              @page {
                margin: 0;
              }
              body {
                margin: 2cm;
              }
            }
            body {
              font-family: 'Lato', sans-serif;
              line-height: 1.4;
              color: #000;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              font-size: 11px;
            }
            .header-logo {
              max-width: 200px;
              margin-bottom: 20px;
            }
            .payment-number {
              text-align: right;
              font-weight: bold;
              margin: 10px 0;
              font-size: 12px;
              color: #333;
            }
            .company-info {
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 10px 0;
              font-size: 10px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 6px;
              text-align: left;
              font-size: 10px;
            }
            h3, h4 {
              font-size: 12px;
            }
            p {
              font-size: 11px;
              margin: 5px 0;
            }
            /* Hide any duplicate company headers in the AI output */
            .formatted-receipt h2:first-child,
            .formatted-receipt h1:first-child {
              display: none;
            }
            /* Force beneficiary section to align right */
            .formatted-receipt > div:first-of-type {
              text-align: right !important;
            }
            .formatted-receipt div[style*="text-align: right"],
            .formatted-receipt div:has(p:contains("Beneficiary")) {
              text-align: right !important;
            }
            .formatted-receipt p:contains("Beneficiary"),
            .formatted-receipt p:contains("Name:"),
            .formatted-receipt p:contains("Purpose:") {
              text-align: right !important;
            }
            /* Force authorized signature to align right */
            .formatted-receipt > div:last-of-type {
              text-align: right !important;
            }
            @media print {
              body {
                padding: 0;
              }
              .formatted-receipt > div:first-of-type {
                text-align: right !important;
              }
              .formatted-receipt > div:last-of-type {
                text-align: right !important;
              }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: flex-end; align-items: flex-start; margin-bottom: 10px;">
            <div style="text-align: right;">
              <img src="${logoToUse}" alt="${company?.name || ''}" class="header-logo" style="margin: 0 0 5px 0;" />
              ${receiptNumber ? `<div class="payment-number" style="margin: 0;">Payment Number: #${receiptNumber}</div>` : ''}
            </div>
          </div>
          
          <div class="company-info">
            <h2 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">${company?.name || ''}</h2>
            ${company?.company_number || company?.nipc ? `<p style="margin: 2px 0; font-size: 10px;">Company Number: ${company?.company_number || company?.nipc || ''}</p>` : ''}
            ${companyAddress}
          </div>
          
          <hr style="border: none; border-top: 1px solid #ccc; margin: 0 0 15px 0;" />
          
          <div class="formatted-receipt">
            ${generatedReceipt}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Execute script to remove headers/footers and print
    printWindow.onload = () => {
      // Remove default browser headers and footers
      const style = printWindow.document.createElement('style');
      style.textContent = `
        @page { 
          margin: 0; 
          size: A4;
        }
        body { 
          margin: 2cm; 
        }
      `;
      printWindow.document.head.appendChild(style);
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };


  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Receipt Generator</h1>
            <p className="text-sm text-muted-foreground">
              Format and print professional receipts using AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {receiptId && (
            <Button
              variant="outline"
              onClick={handleNewReceipt}
            >
              <FileText className="mr-2 h-4 w-4" />
              New Receipt
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!generatedReceipt}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !generatedReceipt}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Status Indicator */}
          {!session?.user && (
            <Card className="bg-yellow-50 border-yellow-200 p-4 mb-6">
              <p className="text-sm text-yellow-800">
                You need to be logged in to save receipts
              </p>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="editor">Receipt Editor</TabsTrigger>
              <TabsTrigger value="history">Previous Receipts</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-6">
              {/* Content Editor */}
              <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Receipt Content</label>
              <Button
                onClick={handleGenerate}
                disabled={!content.trim() || isGenerating}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Receipt
                  </>
                )}
              </Button>
            </div>
            <Card>
              <div className="p-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your receipt information here..."
                  className="min-h-[300px] font-mono text-sm resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </Card>
          </div>

          {/* Generated Receipt Preview */}
          {generatedReceipt && (
            <div>
              {receiptNumber && (
                <div className="flex items-center justify-end mb-2">
                  <div className="text-sm text-muted-foreground">
                    Receipt Number: <span className="font-semibold">#{receiptNumber}</span>
                  </div>
                </div>
              )}
               <Card className="bg-white shadow-lg">
                <div className="p-8 relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-left flex-1 mr-4">
                      {(() => {
                        const isEpic = content.toLowerCase().includes('epicatmosphere') || 
                                      generatedReceipt.toLowerCase().includes('epicatmosphere');
                        const company = isEpic 
                          ? getCompanyData('epic atmosphere')
                          : getCompanyData('sustainable yield');
                        
                        return (
                          <>
                            <h2 className="text-lg font-bold uppercase tracking-wide mb-1">{company?.name || ''}</h2>
                            {(company?.company_number || company?.nipc) && (
                              <p className="text-sm">Company Number: {company?.company_number || company?.nipc}</p>
                            )}
                            {company?.address && (
                              <p className="text-sm">Morada Registada: {company.address}{company.country ? ', ' + company.country : ''}</p>
                            )}
                            {company?.email && (
                              <p className="text-sm">Email: {company.email}</p>
                            )}
                            {company?.bank_account && (
                              <p className="text-sm">Conta Bancária: {company.bank_account}{company.bank_name ? ' (' + company.bank_name + ')' : ''}</p>
                            )}
                            {company?.capital_social && (
                              <p className="text-sm">Capital Social: {company.capital_social}</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex-shrink-0">
                      <img 
                        src={(content.toLowerCase().includes('epicatmosphere') || 
                              generatedReceipt.toLowerCase().includes('epicatmosphere')) 
                              ? epicatmosphereLogo 
                              : sustainableYieldLogo} 
                        alt="Company Logo" 
                        className="w-48 h-auto"
                      />
                    </div>
                  </div>
                  <hr className="border-t border-gray-300 mb-6" />
                  {receiptNumber && (
                    <div className="text-right font-semibold text-sm mb-4">
                      Payment Number: #{receiptNumber}
                    </div>
                  )}
                  <div 
                    className="formatted-receipt"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatedReceipt) }}
                  />
                </div>
                </Card>
              </div>
            )}

            {!generatedReceipt && content.trim() && (
              <Card className="bg-muted/30">
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>Click "Generate Receipt" to format your content</p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <PreviousReceipts onLoadReceipt={handleLoadReceipt} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </div>
  );
};

export default ReceiptGenerator;
