
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import AiResume from "./AiResume";
import TradeInfoSection from "./TradeInfoSection";
import TradingChat from "./TradingChat";
import { Token, TradeInfo } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JournalSummary from "./JournalSummary";
import TradingSettlementNotes from "./TradingSettlementNotes";

interface SpecialSectionsProps {
  noteId: string;
  content: string;
  initialSummary: string;
  onSummaryGenerated?: (summary: string) => void;
  isTradingCategory: boolean;
  availableTokens: Token[];
  isLoadingTokens: boolean;
  tradeInfo?: TradeInfo;
  onTradeInfoChange: (tradeInfo: TradeInfo) => void;
}

const SpecialSections = ({
  noteId,
  content,
  initialSummary,
  onSummaryGenerated,
  isTradingCategory,
  availableTokens,
  isLoadingTokens,
  tradeInfo,
  onTradeInfoChange
}: SpecialSectionsProps) => {
  const [chatSummary, setChatSummary] = useState<string>("");
  
  const handleChatSummaryUpdated = (summary: string) => {
    setChatSummary(summary);
    
    // If there's no content-based summary but we have a chat summary,
    // use the chat summary as the note summary
    if ((!initialSummary || initialSummary.trim() === "") && summary && onSummaryGenerated) {
      onSummaryGenerated(summary);
    }
  };
  
  // Combine content-based summary with chat summary if both exist
  const combinedSummary = initialSummary && chatSummary 
    ? `${initialSummary}\n\n**Trade Journal Summary:**\n${chatSummary}` 
    : initialSummary || chatSummary;

  return (
    <>
      {/* AI Resume Section */}
      <Card className="p-4 border rounded-md">
        <AiResume 
          noteId={noteId}
          content={content}
          initialSummary={combinedSummary}
          onSummaryGenerated={onSummaryGenerated}
        />
      </Card>
      
      {/* Trade Info Section - Only displayed for trading categories */}
      {isTradingCategory && (
        <Card className="p-4 border rounded-md mt-4">
          <Tabs defaultValue="trade-info">
            <TabsList className="mb-4">
              <TabsTrigger value="trade-info">Trade Info</TabsTrigger>
              <TabsTrigger value="trade-journal">Trade Journal</TabsTrigger>
              <TabsTrigger value="trade-settlements">Trade Settlements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trade-info">
              <TradeInfoSection 
                availableTokens={availableTokens}
                isLoadingTokens={isLoadingTokens}
                tradeInfo={tradeInfo}
                onTradeInfoChange={onTradeInfoChange}
                noteContent={content}
              />
            </TabsContent>
            
            <TabsContent value="trade-journal">
              {/* Journal Summary Section - Always show even when empty */}
              <div className="mb-4">
                <JournalSummary 
                  summary={chatSummary} 
                  onRefresh={chatSummary ? () => {
                    if (noteId) {
                      // This will trigger the chat to regenerate its summary
                      const tradingChatElement = document.getElementById('trading-chat');
                      if (tradingChatElement) {
                        // Signal to the TradingChat component to regenerate the summary
                        const event = new CustomEvent('regenerate-summary');
                        tradingChatElement.dispatchEvent(event);
                      }
                    }
                  } : undefined}
                />
              </div>
              <TradingChat 
                noteId={noteId} 
                onChatSummaryUpdated={handleChatSummaryUpdated}
              />
            </TabsContent>
            
            <TabsContent value="trade-settlements">
              <TradingSettlementNotes noteId={noteId} />
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </>
  );
};

export default SpecialSections;
