import { useState } from "react";
import { ArrowLeft, Printer, Save, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import sustainableYieldLogo from "@/assets/sustainable-yield-logo-new.png";

const ReceiptGenerator = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [content, setContent] = useState("");
  const [generatedReceipt, setGeneratedReceipt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<number | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Error formatting receipt:', error);
      toast.error("Failed to format receipt. Please try again.");
    } finally {
      setIsGenerating(false);
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
        formatted_content: generatedReceipt,
        beneficiary_name: null,
        payment_amount: null,
        payment_date: null,
        payment_reference: null,
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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Sustainable Yield Capital</title>
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: Arial, sans-serif;
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
            @media print {
              body {
                padding: 0;
              }
              .formatted-receipt > div:first-of-type {
                text-align: right !important;
              }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
            <div style="text-align: left;">
              <h2 style="margin: 0 0 5px 0; font-size: 12px; font-weight: bold;">SUSTAINABLE YIELD CAPITAL LTD</h2>
              <p style="margin: 2px 0; font-size: 10px;">Dept 302, 43 Owston Road Carcroft</p>
              <p style="margin: 2px 0; font-size: 10px;">Doncaster, DN6 8DA – United Kingdom</p>
              <p style="margin: 2px 0; font-size: 10px;">Company Number: 15769755</p>
            </div>
            <img src="${sustainableYieldLogo}" alt="Sustainable Yield Capital" class="header-logo" />
          </div>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 0 0 15px 0;" />
          ${receiptNumber ? `<div class="payment-number">Payment Number: #${receiptNumber}</div>` : ''}
          <div class="formatted-receipt">
            ${generatedReceipt}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
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
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Status Indicator */}
          {!session?.user && (
            <Card className="bg-yellow-50 border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                You need to be logged in to save receipts
              </p>
            </Card>
          )}

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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Formatted Receipt</label>
                {receiptNumber && (
                  <div className="text-sm text-muted-foreground">
                    Receipt Number: <span className="font-semibold">#{receiptNumber}</span>
                  </div>
                )}
              </div>
              <Card className="bg-white shadow-lg">
                <div className="p-8 relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-left">
                      <h2 className="text-lg font-bold mb-1">SUSTAINABLE YIELD CAPITAL LTD</h2>
                      <p className="text-xs mb-0.5">Dept 302, 43 Owston Road Carcroft</p>
                      <p className="text-xs mb-0.5">Doncaster, DN6 8DA – United Kingdom</p>
                      <p className="text-xs">Company Number: 15769755</p>
                    </div>
                    <img 
                      src={sustainableYieldLogo} 
                      alt="Sustainable Yield Capital" 
                      className="w-48 h-auto"
                    />
                  </div>
                  <hr className="border-t border-gray-300 mb-6" />
                  {receiptNumber && (
                    <div className="text-right font-semibold text-sm mb-4">
                      Payment Number: #{receiptNumber}
                    </div>
                  )}
                  <div 
                    className="formatted-receipt"
                    dangerouslySetInnerHTML={{ __html: generatedReceipt }}
                    style={{
                      // Force right alignment for beneficiary sections
                      '& > div:first-of-type': {
                        textAlign: 'right'
                      }
                    } as React.CSSProperties}
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
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;
