
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Bot, User } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

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
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const { data: chatHistory, refetch: refetchChatHistory } = useQuery({
    queryKey: ['tradingChatHistory', noteId],
    queryFn: async () => {
      if (!noteId) return [];
      
      // Using raw SQL query to avoid type issues while types are being updated
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

  // Send message to AI for processing
  const { mutate: sendMessage } = useMutation({
    mutationFn: async (message: string) => {
      if (!noteId) throw new Error("Note ID is required");
      setIsProcessing(true);
      
      try {
        // First save the user message
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
        
        // Process with the AI in our edge function
        const response = await supabase.functions.invoke('trading-assistant', {
          body: { message, noteId }
        });
        
        if (response.error) throw new Error(response.error.message);
        
        // Save AI response to database
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
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      refetchChatHistory();
      setMessage("");
      
      // Generate a summary of chat for the AI Resume section
      if (chatHistory && chatHistory.length > 0 && onChatSummaryUpdated) {
        generateChatSummary();
      }
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "There was an error processing your trade information.",
        variant: "destructive",
      });
    },
  });

  // Clear chat history
  const { mutate: clearHistory } = useMutation({
    mutationFn: async () => {
      if (!noteId) throw new Error("Note ID is required");
      
      // Direct delete approach without using RPC
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
      
      // Clear the summary when chat is cleared
      if (onChatSummaryUpdated) {
        onChatSummaryUpdated("");
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

  // Generate a summary of the chat for AI Resume
  const generateChatSummary = async () => {
    if (!chatHistory || chatHistory.length === 0 || !noteId) return;
    
    try {
      // Concatenate all messages, focusing on AI responses which contain structured information
      const aiMessages = chatHistory.filter(msg => msg.is_ai).map(msg => msg.content);
      
      if (aiMessages.length === 0) return;
      
      // Use the edge function to generate a summary
      const response = await supabase.functions.invoke('summarize-note', {
        body: { 
          content: aiMessages.join("\n\n"),
          maxLength: 250,
          summarizeTradeChat: true
        },
      });
      
      if (response.error) {
        console.error("Error generating chat summary:", response.error);
        return;
      }
      
      const summary = response.data?.summary || "";
      
      if (summary && onChatSummaryUpdated) {
        onChatSummaryUpdated(summary);
      }
    } catch (error) {
      console.error("Error generating chat summary:", error);
    }
  };

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!message.trim() || !noteId) return;
    sendMessage(message.trim());
  };

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Generate initial summary when component loads with existing chat history
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0 && onChatSummaryUpdated) {
      generateChatSummary();
    }
  }, []);

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-medium">Trade Journal</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => clearHistory()}
          className="text-xs"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear History
        </Button>
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
          placeholder="Describe your trade (e.g., 'I bought 200 units at $250 each')..."
          className="pr-12 min-h-[80px] resize-none focus:ring-1 focus:ring-blue-500"
          disabled={isProcessing}
        />
        <Button
          className="absolute right-2 bottom-2"
          size="sm"
          variant={message.trim() ? "default" : "ghost"}
          disabled={!message.trim() || isProcessing}
          onClick={handleSendMessage}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TradingChat;
