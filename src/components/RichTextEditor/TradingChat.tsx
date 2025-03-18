
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TradingChatProps {
  noteId?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  is_ai: boolean;
}

const TradingChat = ({ noteId }: TradingChatProps) => {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const { data: chatHistory, refetch: refetchChatHistory } = useQuery({
    queryKey: ['tradingChatHistory', noteId],
    queryFn: async () => {
      if (!noteId) return [];
      
      const { data, error } = await supabase
        .from('trading_chat_messages')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });
      
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
          .single();
        
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
          .single();
        
        if (aiResponseError) throw aiResponseError;
        
        return { userMessage, aiResponse };
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      refetchChatHistory();
      setMessage("");
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
      
      <Card className="flex-1 mb-3 p-3 overflow-hidden">
        <ScrollArea className="h-[380px] w-full pr-4">
          {chatHistory && chatHistory.length > 0 ? (
            <div className="space-y-4">
              {chatHistory.map((chat: ChatMessage) => (
                <div 
                  key={chat.id} 
                  className={`flex ${chat.is_ai ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`rounded-lg p-3 max-w-[80%] ${
                      chat.is_ai 
                        ? 'bg-secondary text-secondary-foreground' 
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{chat.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(chat.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">
                No trade information yet. Start by describing your trade details.
              </p>
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
          className="pr-12 min-h-[80px]"
          disabled={isProcessing}
        />
        <Button
          className="absolute right-2 bottom-2"
          size="sm"
          onClick={handleSendMessage}
          disabled={!message.trim() || isProcessing}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TradingChat;
