
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import AiResume from "./AiResume";
import TradeInfoSection from "./TradeInfoSection";
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
    </>
  );
};

export default SpecialSections;
