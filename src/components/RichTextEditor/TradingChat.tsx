
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Bot, User, Eraser } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";

interface TradingChatProps {
  noteId?: string;
  onChatSummaryUpdated?: (summary: string) => void;
}

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  is_ai: boolean;
}

const TradingChat = ({ noteId, onChatSummaryUpdated }: TradingChatProps) => {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const [currentSummary, setCurrentSummary] = useState("");

  const { data: chatHistory, refetch: refetchChatHistory } = useQuery({
    queryKey: ['tradingChatHistory', noteId],
    queryFn: async () => {
      if (!noteId) return [];
      
      const { data, error } = await supabase
        .from('trading_chat_messages')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: true }) as { data: ChatMessage[] | null, error: any };
      
      if (error) {
        console.error("Error fetching chat history:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!noteId,
  });

  const { mutate: sendMessage } = useMutation({
    mutationFn: async (message: string) => {
      if (!noteId) throw new Error("Note ID is required");
      setIsProcessing(true);
      
      try {
        // Handle remove mode differently
        if (isRemoveMode) {
          // Store the user message first
          const { data: userMessage, error: userMessageError } = await supabase
            .from('trading_chat_messages')
            .insert({
              note_id: noteId,
              content: `Remove request: ${message}`,
              is_ai: false
            })
            .select('*')
            .single() as { data: ChatMessage | null, error: any };
        
          if (userMessageError) throw userMessageError;
          
          console.log("Sending removal request with summary:", currentSummary);
          
          // Call the edge function with remove action
          const response = await supabase.functions.invoke('trading-assistant', {
            body: { 
              message, 
              noteId, 
              action: 'remove_bullet_point',
              summaryText: currentSummary
            }
          });
          
          if (response.error) throw new Error(response.error.message);
          
          // Update the summary if the call was successful
          if (response.data.updatedSummary && onChatSummaryUpdated) {
            onChatSummaryUpdated(response.data.updatedSummary);
            setCurrentSummary(response.data.updatedSummary);
          }
          
          // Add AI response to the chat
          const { data: aiResponse, error: aiResponseError } = await supabase
            .from('trading_chat_messages')
            .insert({
              note_id: noteId,
              content: response.data.response || "Processed removal request",
              is_ai: true
            })
            .select('*')
            .single() as { data: ChatMessage | null, error: any };
          
          if (aiResponseError) throw aiResponseError;
          
          // Turn off remove mode
          setIsRemoveMode(false);
          
          return { userMessage, aiResponse };
        } else {
          // Normal chat flow
          const { data: userMessage, error: userMessageError } = await supabase
            .from('trading_chat_messages')
            .insert({
              note_id: noteId,
              content: message,
              is_ai: false
            })
            .select('*')
            .single() as { data: ChatMessage | null, error: any };
          
          if (userMessageError) throw userMessageError;
          
          const response = await supabase.functions.invoke('trading-assistant', {
            body: { message, noteId }
          });
          
          if (response.error) throw new Error(response.error.message);
          
          const { data: aiResponse, error: aiResponseError } = await supabase
            .from('trading_chat_messages')
            .insert({
              note_id: noteId,
              content: response.data.response,
              is_ai: true
            })
            .select('*')
            .single() as { data: ChatMessage | null, error: any };
          
          if (aiResponseError) throw aiResponseError;
          
          return { userMessage, aiResponse };
        }
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      refetchChatHistory();
      setMessage("");
      
      if (onChatSummaryUpdated && !isRemoveMode) {
        generateChatSummary();
      }
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      setIsRemoveMode(false);
    },
  });

  const { mutate: clearHistory } = useMutation({
    mutationFn: async () => {
      if (!noteId) throw new Error("Note ID is required");
      
      const { error } = await supabase
        .from('trading_chat_messages')
        .delete()
        .eq('note_id', noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchChatHistory();
      toast({
        title: "Chat history cleared",
        description: "All trade information has been cleared.",
      });
      
      if (onChatSummaryUpdated) {
        onChatSummaryUpdated("");
        setCurrentSummary("");
      }
    },
    onError: (error) => {
      console.error("Error clearing history:", error);
      toast({
        title: "Error clearing history",
        description: "There was an error clearing the trade information.",
        variant: "destructive",
      });
    },
  });

  const generateChatSummary = async () => {
    if (!chatHistory || chatHistory.length === 0 || !noteId) return;
    
    try {
      const aiMessages = chatHistory.filter(msg => msg.is_ai).map(msg => msg.content);
      
      if (aiMessages.length === 0) return;
      
      const response = await supabase.functions.invoke('summarize-note', {
        body: { 
          content: aiMessages.join("\n\n"),
          maxLength: 250,
          summarizeTradeChat: true,
          formatAsBulletPoints: true
        },
      });
      
      if (response.error) {
        console.error("Error generating chat summary:", response.error);
        return;
      }
      
      const summary = response.data?.summary || "";
      setCurrentSummary(summary);
      
      if (summary && onChatSummaryUpdated) {
        onChatSummaryUpdated(summary);
      }
    } catch (error) {
      console.error("Error generating chat summary:", error);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !noteId) return;
    sendMessage(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRemoveMode = () => {
    setIsRemoveMode(!isRemoveMode);
    if (!isRemoveMode) {
      toast({
        title: "Remove mode activated",
        description: "Type what bullet point you want to remove from the summary",
      });
    }
  };

  // Set up the event listener for manual summary regeneration
  useEffect(() => {
    const handleRegenerateSummary = () => {
      generateChatSummary();
    };

    if (componentRef.current) {
      componentRef.current.addEventListener('regenerate-summary', handleRegenerateSummary);
    }

    return () => {
      if (componentRef.current) {
        componentRef.current.removeEventListener('regenerate-summary', handleRegenerateSummary);
      }
    };
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0 && onChatSummaryUpdated) {
      generateChatSummary();
    }
  }, [chatHistory]);

  return (
    <div id="trading-chat" ref={componentRef} className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-medium">Trade Journal</h3>
        <div className="flex gap-2">
          <Button 
            variant={isRemoveMode ? "secondary" : "outline"}
            size="sm" 
            onClick={toggleRemoveMode}
            className="text-xs"
          >
            <Eraser className="h-3.5 w-3.5 mr-1" /> 
            {isRemoveMode ? "Cancel Remove" : "Remove Bullet"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => clearHistory()}
            className="text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear History
          </Button>
        </div>
      </div>
      
      <Card className="flex-1 mb-3 p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border">
        <ScrollArea className="h-[380px] w-full">
          {chatHistory && chatHistory.length > 0 ? (
            <div className="py-4">
              {chatHistory.map((chat: ChatMessage, index) => (
                <div 
                  key={chat.id} 
                  className={`px-4 py-3 ${index % 2 === 0 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-800'}`}
                >
                  <div className="flex items-start max-w-full gap-3">
                    <Avatar className={`h-8 w-8 ${chat.is_ai ? 'bg-blue-600' : 'bg-green-600'}`}>
                      {chat.is_ai ? (
                        <Bot className="h-4 w-4 text-white" />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center">
                        <p className="text-sm font-medium">
                          {chat.is_ai ? 'Trading Assistant' : 'You'}
                        </p>
                        <p className="text-xs text-muted-foreground ml-2">
                          {new Date(chat.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{chat.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-4 text-center">
              <div>
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground max-w-sm">
                  No trade information yet. Start by describing your trade details like
                  entry price, quantity, and asset.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </Card>
      
      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRemoveMode 
            ? "Describe the bullet point to remove (e.g., 'Remove the BTC trade from yesterday')" 
            : "Describe your trade (e.g., 'I bought 200 units at $250 each')..."}
          className={`pr-12 min-h-[80px] resize-none focus:ring-1 ${isRemoveMode ? 'focus:ring-orange-500 border-orange-200' : 'focus:ring-blue-500'}`}
          disabled={isProcessing}
        />
        <Button
          className={`absolute right-2 bottom-2 ${isRemoveMode ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
          size="sm"
          variant={message.trim() ? "default" : "ghost"}
          disabled={!message.trim() || isProcessing}
          onClick={handleSendMessage}
        >
          {isRemoveMode ? <Eraser className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default TradingChat;
