import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const extractTextFromPDF = async (url: string): Promise<string> => {
    try {
      const urlParts = url.split('/storage/v1/object/public/');
      if (urlParts.length < 2) {
        throw new Error('Invalid storage URL format');
      }
      
      const pathParts = urlParts[1].split('/');
      const bucket = pathParts[0];
      const filePath = pathParts.slice(1).join('/');

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) throw error;

      return `[PDF Document: ${fileName}]\n\nNote: This is a PDF file. The AI will analyze based on the filename and document type.`;
    } catch (err) {
      console.error('Error extracting PDF:', err);
      return `[Document: ${fileName}]`;
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

      const { data, error: fnError } = await supabase.functions.invoke('explain-document', {
        body: { fileContent, fileName }
      });

      if (fnError) throw fnError;

      setExplanation(data.explanation);
      await saveAnalysis(data.explanation);
      toast.success('Análise gerada e guardada');
    } catch (err) {
      console.error('Error analyzing document:', err);
      setError('Não foi possível analisar o documento. Tente novamente.');
      toast.error('Erro ao analisar documento');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    analyzeDocument(false);
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

      <ScrollArea className="flex-1 p-4">
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
          <div className="space-y-1">
            {renderMarkdown(explanation)}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
