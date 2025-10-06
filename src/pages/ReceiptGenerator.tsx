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
              line-height: 1.6;
              color: #000;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .logo {
              float: right;
              max-width: 200px;
              margin-bottom: 20px;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: Arial, sans-serif;
              font-size: 11pt;
              clear: both;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 10px 0;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <img src="${sustainableYieldLogo}" alt="Sustainable Yield Capital" class="logo" />
          <pre>${generatedReceipt}</pre>
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
                  <img 
                    src={sustainableYieldLogo} 
                    alt="Sustainable Yield Capital" 
                    className="absolute top-8 right-8 w-48 h-auto opacity-90"
                  />
                  <div 
                    className="formatted-receipt"
                    dangerouslySetInnerHTML={{ __html: generatedReceipt }}
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
