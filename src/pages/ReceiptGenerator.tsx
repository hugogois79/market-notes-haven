import { useState } from "react";
import { FileText, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const ReceiptGenerator = () => {
  const [inputText, setInputText] = useState("");
  const [generatedReceipt, setGeneratedReceipt] = useState("");

  const handleGenerate = () => {
    setGeneratedReceipt(inputText);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

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
            body {
              font-family: 'Courier New', monospace;
              line-height: 1.6;
              color: #000;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: 'Courier New', monospace;
              font-size: 12pt;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Receipt Generator</h1>
        <p className="text-muted-foreground">
          Format and print professional receipts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!inputText.trim()}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Receipt
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

        {/* Output Area */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Preview</label>
            <Card className="min-h-[300px] bg-white shadow-lg">
              {generatedReceipt ? (
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-black leading-relaxed">
                    {generatedReceipt}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>Your formatted receipt will appear here</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {generatedReceipt && (
            <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Print to PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;
