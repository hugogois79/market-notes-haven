import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Bot, Send, Loader2, User, Sparkles, CalendarDays, FileText, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NoteReference {
  index: number;
  id: string;
  title: string;
}

interface Section {
  type: 'critical' | 'family' | 'corporate' | 'finance' | 'suggestion' | 'default';
  content: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  notesUsed?: number;
  noteReferences?: NoteReference[];
  sections?: Section[];
}

interface QuickAction {
  icon: string;
  label: string;
  prompt: string;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{copied ? "Copiado!" : "Copiar resposta"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const AIAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCalendarPage = location.pathname === '/calendar';

  // Quick actions for calendar page
  const calendarQuickActions: QuickAction[] = [
    { icon: "📅", label: "Briefing Semanal", prompt: "Indica tudo o que acontece na próxima semana e verifica conflitos." },
    { icon: "⚡", label: "Verificar Estratégia", prompt: "Compara os eventos do calendário com os meus objetivos mensais e diz-me como estou a progredir." },
    { icon: "⚖️", label: "Prep Legal", prompt: "Resume os próximos eventos legais ou de tribunal e o que devo preparar." },
  ];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear messages when switching context
  useEffect(() => {
    setMessages([]);
  }, [isCalendarPage]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const endpoint = isCalendarPage ? "calendar-assistant" : "ask-ai";
      
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: isCalendarPage 
          ? { query: textToSend, conversationHistory }
          : { query: textToSend },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        notesUsed: data.notesUsed,
        noteReferences: data.noteReferences,
        sections: data.sections,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling AI assistant:", error);
      toast.error("Erro ao comunicar com o assistente AI");
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Desculpa, ocorreu um erro ao processar a tua pergunta. Por favor, tenta novamente.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleOpenNote = (noteId: string) => {
    setIsOpen(false);
    navigate(`/editor/${noteId}`);
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const renderMessageContent = (message: Message) => {
    // If we have sections, render them with rich styling
    if (message.sections && message.sections.length > 0) {
      return (
        <div className="space-y-2">
          {message.sections.map((section, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                getSectionStyles(section.type)
              )}
            >
              <p className="whitespace-pre-wrap">{section.content.trim()}</p>
            </div>
          ))}
        </div>
      );
    }

    // Default text rendering with smart section detection
    return renderSmartContent(message.content);
  };

  const renderSmartContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentSection: { type: string; lines: string[] } = { type: 'default', lines: [] };

    const flushSection = () => {
      if (currentSection.lines.length > 0) {
        elements.push(
          <div
            key={elements.length}
            className={cn(
              "rounded-md px-3 py-2 mb-2",
              getSectionStylesByContent(currentSection.type)
            )}
          >
            <p className="whitespace-pre-wrap text-sm">
              {currentSection.lines.join('\n')}
            </p>
          </div>
        );
        currentSection = { type: 'default', lines: [] };
      }
    };

    for (const line of lines) {
      const lineType = detectLineType(line);
      
      if (lineType !== currentSection.type && currentSection.lines.length > 0) {
        flushSection();
      }
      
      currentSection.type = lineType;
      currentSection.lines.push(line);
    }
    
    flushSection();

    return <div className="space-y-1">{elements}</div>;
  };

  const detectLineType = (line: string): string => {
    const lowerLine = line.toLowerCase();
    if (line.includes('🚨') || lowerLine.includes('crítico') || lowerLine.includes('legal') || line.includes('⚖️')) {
      return 'critical';
    }
    if (line.includes('👨‍👧') || lowerLine.includes('família') || lowerLine.includes('custódia') || lowerLine.includes('filhas')) {
      return 'family';
    }
    if (line.includes('💼') || lowerLine.includes('corporativo') || lowerLine.includes('negócios') || lowerLine.includes('corporate')) {
      return 'corporate';
    }
    if (line.includes('💰') || lowerLine.includes('finanças') || lowerLine.includes('finance') || lowerLine.includes('trading')) {
      return 'finance';
    }
    if (line.includes('⚡') || lowerLine.includes('sugest') || lowerLine.includes('proativ')) {
      return 'suggestion';
    }
    if (line.includes('✈️') || lowerLine.includes('voo') || lowerLine.includes('viag')) {
      return 'travel';
    }
    if (line.includes('🏠') || lowerLine.includes('imobil') || lowerLine.includes('real estate')) {
      return 'realestate';
    }
    return 'default';
  };

  const getSectionStyles = (type: string): string => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-red-500 dark:bg-red-950/30 dark:border-red-400';
      case 'family':
        return 'bg-green-50 border-l-4 border-green-500 dark:bg-green-950/30 dark:border-green-400';
      case 'corporate':
        return 'bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-950/30 dark:border-blue-400';
      case 'finance':
        return 'bg-amber-50 border-l-4 border-amber-500 dark:bg-amber-950/30 dark:border-amber-400';
      case 'suggestion':
        return 'bg-purple-50 border-l-4 border-purple-500 dark:bg-purple-950/30 dark:border-purple-400';
      case 'travel':
        return 'bg-sky-50 border-l-4 border-sky-500 dark:bg-sky-950/30 dark:border-sky-400';
      case 'realestate':
        return 'bg-orange-50 border-l-4 border-orange-500 dark:bg-orange-950/30 dark:border-orange-400';
      default:
        return 'bg-muted';
    }
  };

  const getSectionStylesByContent = (type: string): string => {
    return getSectionStyles(type);
  };

  const getPlaceholder = () => {
    if (isCalendarPage) {
      return "Pede um briefing semanal, verificação de conflitos ou estratégia...";
    }
    return "Faz uma pergunta sobre as tuas notas...";
  };

  const getTitle = () => {
    if (isCalendarPage) {
      return (
        <>
          <CalendarDays className="h-5 w-5 text-primary" />
          Assistente Executivo de Calendário
        </>
      );
    }
    return (
      <>
        <Bot className="h-5 w-5 text-primary" />
        Assistente AI - Chat com as Notas
      </>
    );
  };

  const getEmptyState = () => {
    if (isCalendarPage) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium mb-1">
            Assistente Executivo de Calendário
          </p>
          <p className="text-xs opacity-70 mb-4">
            Gestão estratégica do teu tempo, custódia e objetivos.
          </p>
          
          {/* Quick action chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {calendarQuickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">
          Olá! Sou o teu assistente AI. Faz-me perguntas sobre as tuas notas e eu vou procurar as respostas.
        </p>
        <p className="text-xs mt-2 opacity-70">
          Ex: "Qual é o resumo da última reunião?" ou "O que tenho sobre o projeto X?"
        </p>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
            isCalendarPage 
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
              : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          )}
          size="icon"
        >
          {isCalendarPage ? (
            <CalendarDays className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className={cn(
          "px-4 py-3 border-b",
          isCalendarPage && "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
        )}>
          <SheetTitle className="flex items-center gap-2">
            {getTitle()}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && getEmptyState()}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isCalendarPage ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-primary/10"
                  )}>
                    {isCalendarPage ? (
                      <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Bot className="h-4 w-4 text-primary" />
                    )}
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground px-3 py-2"
                      : "bg-transparent"
                  )}
                >
                  {message.role === "assistant" ? (
                    renderMessageContent(message)
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {/* Note reference buttons */}
                  {message.role === "assistant" && message.noteReferences && message.noteReferences.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground mr-1">Abrir nota:</span>
                      <TooltipProvider>
                        {message.noteReferences.map((ref) => (
                          <Tooltip key={ref.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleOpenNote(ref.id)}
                                className="h-6 w-6 rounded-full bg-primary/20 hover:bg-primary/40 text-primary font-medium text-xs flex items-center justify-center transition-colors"
                              >
                                {ref.index}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="text-xs truncate">{ref.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  )}
                  
                  {/* Copy button for assistant messages */}
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                      <CopyButton text={message.content} />
                      {message.notesUsed !== undefined && (
                        <span className="text-xs opacity-70">
                          {message.notesUsed > 0
                            ? `Baseado em ${message.notesUsed} nota${message.notesUsed > 1 ? "s" : ""}`
                            : "Sem notas relevantes encontradas"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  isCalendarPage ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-primary/10"
                )}>
                  {isCalendarPage ? (
                    <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {isCalendarPage 
                        ? "A analisar o teu calendário..." 
                        : "A pesquisar nas tuas notas..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick actions bar for calendar (when there are messages) */}
        {isCalendarPage && messages.length > 0 && (
          <div className="border-t px-4 py-2 bg-muted/30">
            <div className="flex gap-2 overflow-x-auto">
              {calendarQuickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-background border hover:bg-muted transition-colors whitespace-nowrap"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={getPlaceholder()}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className={isCalendarPage ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AIAssistant;
