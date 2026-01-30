import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Send, Loader2, User, Sparkles, CalendarDays, LayoutGrid, Copy, Check, ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KanbanService } from "@/services/kanbanService";

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

// Kanban AI types
interface ExtractedBoard {
  title: string;
  description?: string;
  color?: string;
  selected: boolean;
}

interface ExtractedList {
  title: string;
  boardRef?: number;
  selected: boolean;
}

interface ExtractedCard {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  listRef?: number;
  selected: boolean;
}

interface ExtractedKanbanItems {
  boards: ExtractedBoard[];
  lists: ExtractedList[];
  cards: ExtractedCard[];
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
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Context detection - check both /kanban and /kanban/:id routes
  const isCalendarPage = location.pathname === '/calendar';
  const isKanbanPage = location.pathname === '/kanban' || location.pathname.startsWith('/kanban/');
  
  // Extract boardId from URL if on a specific board page
  const currentBoardId = location.pathname.startsWith('/kanban/') 
    ? location.pathname.split('/kanban/')[1]?.split('/')[0] || null
    : null;

  // Kanban mode states
  const [kanbanInputText, setKanbanInputText] = useState('');
  const [kanbanExtractedItems, setKanbanExtractedItems] = useState<ExtractedKanbanItems | null>(null);
  const [kanbanStep, setKanbanStep] = useState<'input' | 'results'>('input');
  const [isCreating, setIsCreating] = useState(false);
  
  // Current board context states
  const [currentBoardInfo, setCurrentBoardInfo] = useState<{ id: string; title: string; lists: Array<{ id: string; title: string }> } | null>(null);
  const [loadingBoardInfo, setLoadingBoardInfo] = useState(false);
  
  // Load current board info when on a specific board page
  useEffect(() => {
    const loadBoardInfo = async () => {
      if (!currentBoardId || !isOpen) {
        setCurrentBoardInfo(null);
        return;
      }
      
      setLoadingBoardInfo(true);
      try {
        // Load board info
        const { data: boardData, error: boardError } = await supabase
          .from('kanban_boards')
          .select('id, title')
          .eq('id', currentBoardId)
          .single();
        
        if (boardError) throw boardError;
        
        // Load lists for this board
        const lists = await KanbanService.getLists(currentBoardId);
        
        setCurrentBoardInfo({
          id: boardData.id,
          title: boardData.title,
          lists: lists.map(l => ({ id: l.id, title: l.title }))
        });
      } catch (error) {
        console.error('Error loading board info:', error);
        setCurrentBoardInfo(null);
      } finally {
        setLoadingBoardInfo(false);
      }
    };
    
    loadBoardInfo();
  }, [currentBoardId, isOpen]);

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
    if (isOpen && inputRef.current && !isKanbanPage) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isKanbanPage]);

  // Clear state when switching context or closing
  useEffect(() => {
    setMessages([]);
    setKanbanInputText('');
    setKanbanExtractedItems(null);
    setKanbanStep('input');
  }, [isCalendarPage, isKanbanPage]);

  // Reset kanban state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setKanbanInputText('');
      setKanbanExtractedItems(null);
      setKanbanStep('input');
    }
  }, [isOpen]);

  // Generate Kanban structure from text
  const generateKanbanStructure = async () => {
    if (!kanbanInputText.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // If we're on a specific board, use generate-tasks endpoint (cards only)
      // Otherwise use generate-kanban-structure (full structure)
      if (currentBoardInfo) {
        const { data, error } = await supabase.functions.invoke('generate-tasks-from-text', {
          body: { text: kanbanInputText }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        // Only cards when on a specific board
        const extractedItems: ExtractedKanbanItems = {
          boards: [],
          lists: [],
          cards: (data.tasks || []).map((c: any) => ({ 
            title: c.title,
            description: c.description,
            priority: c.priority,
            selected: true 
          }))
        };

        if (extractedItems.cards.length === 0) {
          toast.error('Não foram encontrados cards acionáveis no texto.');
        } else {
          setKanbanExtractedItems(extractedItems);
          setKanbanStep('results');
        }
      } else {
        const { data, error } = await supabase.functions.invoke('generate-kanban-structure', {
          body: { text: kanbanInputText }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        // Add selected: true to all items by default
        const extractedItems: ExtractedKanbanItems = {
          boards: (data.boards || []).map((b: any) => ({ ...b, selected: true })),
          lists: (data.lists || []).map((l: any) => ({ ...l, selected: true })),
          cards: (data.cards || []).map((c: any) => ({ ...c, selected: true }))
        };

        setKanbanExtractedItems(extractedItems);
        setKanbanStep('results');
      }

    } catch (error) {
      console.error("Error generating kanban structure:", error);
      toast.error("Erro ao analisar o texto");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (type: 'boards' | 'lists' | 'cards', index: number) => {
    if (!kanbanExtractedItems) return;

    setKanbanExtractedItems(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [type]: prev[type].map((item, i) => 
          i === index ? { ...item, selected: !item.selected } : item
        )
      };
    });
  };

  // Create selected items
  const createSelectedItems = async () => {
    if (!kanbanExtractedItems) return;

    setIsCreating(true);

    try {
      // MODE 1: Adding cards to existing board
      if (currentBoardInfo && currentBoardInfo.lists.length > 0) {
        const selectedCards = kanbanExtractedItems.cards.filter(c => c.selected);
        const targetListId = currentBoardInfo.lists[0].id; // First list as default
        
        for (let i = 0; i < selectedCards.length; i++) {
          const card = selectedCards[i];
          await KanbanService.createCard({
            list_id: targetListId,
            title: card.title,
            description: card.description,
            priority: card.priority,
            position: i
          });
        }

        // Refresh the current board data
        queryClient.invalidateQueries({ queryKey: ['kanban-board', currentBoardInfo.id] });
        queryClient.invalidateQueries({ queryKey: ['kanban-lists', currentBoardInfo.id] });
        queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });

        toast.success(`${selectedCards.length} cards adicionados ao board "${currentBoardInfo.title}"!`);
      } 
      // MODE 2: Creating full structure (boards, lists, cards)
      else {
        const boardIdMap: Record<number, string> = {};
        const listIdMap: Record<number, string> = {};

        // 1. Create boards
        const selectedBoards = kanbanExtractedItems.boards.filter(b => b.selected);
        for (let i = 0; i < selectedBoards.length; i++) {
          const board = selectedBoards[i];
          const originalIndex = kanbanExtractedItems.boards.findIndex(b => b.title === board.title);
          
          const created = await KanbanService.createBoard({
            title: board.title,
            description: board.description,
            color: board.color || 'blue'
          });
          
          boardIdMap[originalIndex] = created.id;

          // Create default lists for the board
          await KanbanService.createList({
            board_id: created.id,
            title: 'A Fazer',
            position: 0
          });
          await KanbanService.createList({
            board_id: created.id,
            title: 'Em Progresso',
            position: 1
          });
          await KanbanService.createList({
            board_id: created.id,
            title: 'Concluído',
            position: 2
          });
        }

        // 2. Create lists (if they reference a created board)
        const selectedLists = kanbanExtractedItems.lists.filter(l => l.selected);
        for (let i = 0; i < selectedLists.length; i++) {
          const list = selectedLists[i];
          const originalIndex = kanbanExtractedItems.lists.findIndex(l => l.title === list.title);
          
          // Only create if boardRef points to a created board
          if (list.boardRef !== undefined && boardIdMap[list.boardRef]) {
            const created = await KanbanService.createList({
              board_id: boardIdMap[list.boardRef],
              title: list.title,
              position: 10 + i // After default lists
            });
            listIdMap[originalIndex] = created.id;
          }
        }

        // 3. Create cards (if they reference a created list)
        const selectedCards = kanbanExtractedItems.cards.filter(c => c.selected);
        let cardsCreated = 0;
        
        for (let i = 0; i < selectedCards.length; i++) {
          const card = selectedCards[i];
          
          // Find the target list
          let targetListId: string | undefined;
          
          if (card.listRef !== undefined && listIdMap[card.listRef]) {
            targetListId = listIdMap[card.listRef];
          }
          
          // If no list reference or list wasn't created, skip for now
          // (Cards need a list to belong to)
          if (!targetListId) {
            // Try to find a default list from a created board
            const firstBoardId = Object.values(boardIdMap)[0];
            if (firstBoardId) {
              const lists = await KanbanService.getLists(firstBoardId);
              targetListId = lists[0]?.id;
            }
          }

          if (targetListId) {
            await KanbanService.createCard({
              list_id: targetListId,
              title: card.title,
              description: card.description,
              priority: card.priority,
              position: i
            });
            cardsCreated++;
          }
        }

        // Refresh boards data
        queryClient.invalidateQueries({ queryKey: ['kanban-boards'] });

        const totalCreated = selectedBoards.length + selectedLists.length + cardsCreated;
        toast.success(`${totalCreated} itens criados com sucesso!`);
      }

      // Reset and close
      setKanbanInputText('');
      setKanbanExtractedItems(null);
      setKanbanStep('input');
      setIsOpen(false);

    } catch (error) {
      console.error("Error creating kanban items:", error);
      toast.error("Erro ao criar itens");
    } finally {
      setIsCreating(false);
    }
  };

  // Count selected items
  const getSelectedCount = () => {
    if (!kanbanExtractedItems) return 0;
    return (
      kanbanExtractedItems.boards.filter(b => b.selected).length +
      kanbanExtractedItems.lists.filter(l => l.selected).length +
      kanbanExtractedItems.cards.filter(c => c.selected).length
    );
  };

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

      // If an event was created, refresh the calendar data
      if (data.eventCreated) {
        queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
        toast.success("Evento criado no calendário!");
      }

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
    if (isKanbanPage) {
      return (
        <>
          <LayoutGrid className="h-5 w-5 text-indigo-600" />
          {currentBoardInfo 
            ? `Adicionar a ${currentBoardInfo.title}`
            : 'Assistente AI - Kanban'
          }
        </>
      );
    }
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

  // Render Kanban mode content
  const renderKanbanContent = () => {
    if (kanbanStep === 'input') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 p-4">
            {/* Show current board context if available */}
            {loadingBoardInfo ? (
              <div className="text-center py-4">
                <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
              </div>
            ) : currentBoardInfo ? (
              <div className="mb-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs text-muted-foreground mb-1">A adicionar cards ao board:</p>
                <p className="font-medium text-indigo-700 dark:text-indigo-300">{currentBoardInfo.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lista destino: {currentBoardInfo.lists[0]?.title || 'Primeira lista'}
                </p>
              </div>
            ) : null}

            <div className="text-center py-6 text-muted-foreground mb-4">
              <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50 text-indigo-500" />
              <p className="text-sm font-medium mb-1">
                {currentBoardInfo ? 'Gerar Cards' : 'Gerar Estrutura Kanban'}
              </p>
              <p className="text-xs opacity-70">
                {currentBoardInfo 
                  ? 'Cola um texto e a AI vai extrair cards para adicionar ao board atual.'
                  : 'Cola um texto (relatório, email, lista de tarefas) e a AI vai extrair boards, listas e cards.'
                }
              </p>
            </div>

            <Textarea
              placeholder={currentBoardInfo 
                ? "Cole aqui o texto para extrair cards...\n\nExemplo: Lista de tarefas, email com ações, relatório...\n\nPressiona Ctrl+Enter para gerar"
                : "Cole aqui o texto para analisar...\n\nExemplo: Relatório de projeto, email com tarefas, lista de afazeres...\n\nPressiona Ctrl+Enter para gerar"
              }
              value={kanbanInputText}
              onChange={(e) => setKanbanInputText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (kanbanInputText.trim() && kanbanInputText.length >= 30 && !isLoading) {
                    generateKanbanStructure();
                  }
                }
              }}
              className="min-h-[200px] resize-none"
            />
          </div>

          <div className="border-t p-4">
            <Button
              onClick={generateKanbanStructure}
              disabled={!kanbanInputText.trim() || kanbanInputText.length < 30 || isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A analisar...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {currentBoardInfo ? 'Gerar Cards' : 'Gerar Estrutura'}
                </>
              )}
            </Button>
            {kanbanInputText.length > 0 && kanbanInputText.length < 30 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Mínimo 30 caracteres ({kanbanInputText.length}/30)
              </p>
            )}
          </div>
        </div>
      );
    }

    // Results step
    if (kanbanStep === 'results' && kanbanExtractedItems) {
      const totalItems = kanbanExtractedItems.boards.length + kanbanExtractedItems.lists.length + kanbanExtractedItems.cards.length;
      
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{totalItems}</span> itens encontrados
                </div>

                {/* Boards */}
                {kanbanExtractedItems.boards.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Boards ({kanbanExtractedItems.boards.length})
                    </h3>
                    {kanbanExtractedItems.boards.map((board, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800"
                      >
                        <Checkbox
                          checked={board.selected}
                          onCheckedChange={() => toggleItemSelection('boards', idx)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{board.title}</p>
                          {board.description && (
                            <p className="text-xs text-muted-foreground truncate">{board.description}</p>
                          )}
                        </div>
                        {board.color && (
                          <span className={cn(
                            "px-1.5 py-0.5 text-[10px] rounded uppercase font-medium",
                            board.color === 'blue' && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                            board.color === 'green' && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
                            board.color === 'purple' && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                            board.color === 'orange' && "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
                            board.color === 'red' && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                          )}>
                            {board.color}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Lists */}
                {kanbanExtractedItems.lists.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                      Listas ({kanbanExtractedItems.lists.length})
                    </h3>
                    {kanbanExtractedItems.lists.map((list, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                      >
                        <Checkbox
                          checked={list.selected}
                          onCheckedChange={() => toggleItemSelection('lists', idx)}
                        />
                        <p className="text-sm flex-1 truncate">{list.title}</p>
                        {list.boardRef !== undefined && kanbanExtractedItems.boards[list.boardRef] && (
                          <span className="text-[10px] text-muted-foreground">
                            → {kanbanExtractedItems.boards[list.boardRef].title}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Cards */}
                {kanbanExtractedItems.cards.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                      Cards ({kanbanExtractedItems.cards.length})
                    </h3>
                    {kanbanExtractedItems.cards.map((card, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-md bg-muted/50 border"
                      >
                        <Checkbox
                          checked={card.selected}
                          onCheckedChange={() => toggleItemSelection('cards', idx)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{card.title}</p>
                          {card.description && (
                            <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                          )}
                        </div>
                        <span className={cn(
                          "px-1.5 py-0.5 text-[10px] rounded uppercase font-medium shrink-0",
                          card.priority === 'high' && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                          card.priority === 'medium' && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                          card.priority === 'low' && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
                        )}>
                          {card.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Show target board info when on a specific board */}
          {currentBoardInfo && (
            <div className="px-4 pb-2">
              <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/30 text-xs">
                <span className="text-muted-foreground">Destino: </span>
                <span className="font-medium text-indigo-700 dark:text-indigo-300">
                  {currentBoardInfo.title} → {currentBoardInfo.lists[0]?.title}
                </span>
              </div>
            </div>
          )}

          <div className="border-t p-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setKanbanStep('input');
                setKanbanExtractedItems(null);
              }}
              disabled={isCreating}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <Button
              onClick={createSelectedItems}
              disabled={getSelectedCount() === 0 || isCreating}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A criar...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {currentBoardInfo 
                    ? `Adicionar ${kanbanExtractedItems?.cards.filter(c => c.selected).length || 0} Cards`
                    : `Criar ${getSelectedCount()} Selecionados`
                  }
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
            isKanbanPage
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
              : isCalendarPage 
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          )}
          size="icon"
        >
          {isKanbanPage ? (
            <LayoutGrid className="h-6 w-6" />
          ) : isCalendarPage ? (
            <CalendarDays className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className={cn(
          "px-4 py-3 border-b",
          isKanbanPage && "bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30",
          isCalendarPage && "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
        )}>
          <SheetTitle className="flex items-center gap-2">
            {getTitle()}
          </SheetTitle>
        </SheetHeader>

        {/* Kanban mode has its own content */}
        {isKanbanPage ? (
          renderKanbanContent()
        ) : (
          <>
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AIAssistant;
