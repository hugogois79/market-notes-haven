import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, RefreshCw, AlertCircle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source for pdf.js (use local bundled worker, not CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface DocumentAIPanelProps {
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
}

export function DocumentAIPanel({ fileUrl, fileName, mimeType }: DocumentAIPanelProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const copyAnalysisAsRichText = async () => {
    if (!contentRef.current || !explanation) return;

    try {
      // Get the HTML content from the rendered element
      const htmlContent = contentRef.current.innerHTML;
      
      // Create a plain text version
      const plainText = explanation
        .replace(/\*\*/g, '')
        .replace(/^#+\s/gm, '')
        .replace(/^[-*]\s/gm, '• ');

      // Copy as rich text (HTML) with plain text fallback
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
      
      toast.success('Análise copiada!');
    } catch (err) {
      // Fallback for browsers that don't support ClipboardItem
      try {
        const plainText = explanation
          .replace(/\*\*/g, '')
          .replace(/^#+\s/gm, '')
          .replace(/^[-*]\s/gm, '• ');
        await navigator.clipboard.writeText(plainText);
        toast.success('Análise copiada (texto simples)');
      } catch (fallbackErr) {
        console.error('Error copying:', fallbackErr);
        toast.error('Erro ao copiar análise');
      }
    }
  };

  const extractTextFromPDF = async (url: string): Promise<string> => {
    try {
      console.log('Extracting text from PDF:', url);
      
      // Fetch the PDF file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log(`PDF loaded, pages: ${pdf.numPages}`);
      
      let fullText = '';
      
      // Extract text from each page (limit to first 20 pages for performance)
      const maxPages = Math.min(pdf.numPages, 20);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += `\n--- Página ${i} ---\n${pageText}`;
      }
      
      if (pdf.numPages > maxPages) {
        fullText += `\n\n[Nota: Documento tem ${pdf.numPages} páginas, apenas as primeiras ${maxPages} foram analisadas]`;
      }
      
      console.log(`Extracted ${fullText.length} characters from PDF`);
      return fullText.trim() || `[PDF sem texto extraível: ${fileName}]`;
    } catch (err) {
      console.error('Error extracting PDF:', err);
      return `[Erro ao extrair PDF: ${fileName}]`;
    }
  };

  const loadCachedAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from("document_ai_analyses")
        .select("explanation")
        .eq("file_url", fileUrl)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExplanation(data.explanation);
        setIsCached(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error loading cached analysis:', err);
      return false;
    }
  };

  const saveAnalysis = async (explanationText: string) => {
    try {
      const { error } = await supabase
        .from("document_ai_analyses")
        .upsert({
          file_url: fileUrl,
          file_name: fileName,
          explanation: explanationText,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'file_url'
        });

      if (error) throw error;
      setIsCached(true);
    } catch (err) {
      console.error('Error saving analysis:', err);
    }
  };

  const analyzeDocument = async (forceRegenerate = false) => {
    if (!forceRegenerate) {
      const hasCached = await loadCachedAnalysis();
      if (hasCached) return;
    }

    setIsLoading(true);
    setError(null);
    setIsCached(false);

    try {
      let fileContent = "";

      if (mimeType?.includes('pdf')) {
        fileContent = await extractTextFromPDF(fileUrl);
      } else if (mimeType?.includes('image')) {
        fileContent = `[Image Document: ${fileName}]\n\nNote: This is an image file. Analysis based on filename.`;
      } else {
        fileContent = `[Document: ${fileName}]`;
      }

      // Call n8n webhook via Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('analyze-document-webhook', {
        body: { 
          fileUrl,
          fileName, 
          mimeType,
          fileContent 
        }
      });

      if (fnError) throw fnError;

      // If n8n returns an explanation directly, use it
      if (data?.data?.explanation) {
        setExplanation(data.data.explanation);
        await saveAnalysis(data.data.explanation);
        toast.success('Análise gerada e guardada');
      } else {
        // n8n will process asynchronously - show pending message
        setExplanation('Documento enviado para análise. A análise será processada em background pelo n8n.');
        toast.success('Documento enviado para análise n8n');
      }
    } catch (err) {
      console.error('Error analyzing document:', err);
      setError('Não foi possível enviar para análise. Tente novamente.');
      toast.error('Erro ao enviar documento');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when document changes - don't auto-analyze
  useEffect(() => {
    setExplanation(null);
    setError(null);
    setIsCached(false);
  }, [fileUrl]);

  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h2 key={i} className="font-bold text-foreground mt-4 mb-2 text-base">{line.replace('# ', '')}</h2>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <h3 key={i} className="font-semibold text-foreground mt-3 mb-1">{line.replace(/\*\*/g, '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className="font-semibold text-foreground mt-3 mb-1">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('### ')) {
          return <h4 key={i} className="font-medium text-foreground mt-2 mb-1">{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const content = line.replace(/^[-*] /, '');
          const parts = content.split(/(\*\*[^*]+\*\*)/g);
          return (
            <li key={i} className="ml-4 text-muted-foreground text-sm">
              {parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={j} className="text-foreground">{part.replace(/\*\*/g, '')}</strong>;
                }
                return part;
              })}
            </li>
          );
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-muted-foreground text-sm">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-foreground">{part.replace(/\*\*/g, '')}</strong>;
              }
              return part;
            })}
          </p>
        );
      });
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Análise AI</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAnalysisAsRichText}
            disabled={isLoading || !explanation}
            title="Copiar análise"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => analyzeDocument(true)}
            disabled={isLoading}
            title="Regenerar análise"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {!explanation && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles className="h-10 w-10 mb-4 text-primary/40" />
            <p className="text-sm text-center mb-4">
              Clique para analisar este documento com AI
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => analyzeDocument(false)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Iniciar Análise
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">A analisar documento...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertCircle className="h-8 w-8 mb-3" />
            <p className="text-sm text-center">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyzeDocument(true)}
              className="mt-3"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {explanation && !isLoading && (
          <div ref={contentRef} className="space-y-1">
            {renderMarkdown(explanation)}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
