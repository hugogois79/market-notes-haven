import { useState } from "react";
import { FileText, Printer, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import sustainableYieldLogo from "@/assets/sustainable-yield-logo.png";

const ReceiptGenerator = () => {
  const [inputText, setInputText] = useState("");
  const [generatedReceipt, setGeneratedReceipt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('format-receipt', {
        body: { content: inputText }
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

  const handleClear = () => {
    setInputText("");
    setGeneratedReceipt("");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Receipt Generator</h1>
        <p className="text-muted-foreground">
          Format and print professional receipts using AI
        </p>
      </div>

      <div className="space-y-6">
        {/* Input Area */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Receipt Content
            </label>
            <Textarea
              placeholder="Paste your receipt text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!inputText.trim() || isGenerating}
              className="flex-1"
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
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={!inputText && !generatedReceipt}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* Preview Area - Below Input */}
        {generatedReceipt && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preview</label>
              <Card className="bg-white shadow-lg">
                <div className="p-6 relative">
                  <img 
                    src={sustainableYieldLogo} 
                    alt="Sustainable Yield Capital" 
                    className="absolute top-6 right-6 w-48 h-auto"
                  />
                  <pre className="whitespace-pre-wrap font-sans text-sm text-black leading-relaxed">
                    {generatedReceipt}
                  </pre>
                </div>
              </Card>
            </div>

            <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Print to PDF
            </Button>
          </div>
        )}

        {!generatedReceipt && !isGenerating && (
          <Card className="bg-muted/50">
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Your AI-formatted receipt will appear here</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReceiptGenerator;
