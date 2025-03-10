
import React from "react";
import { Card } from "@/components/ui/card";
import AiResume from "./AiResume";
import TradeInfoSection from "./TradeInfoSection";
import { Token, TradeInfo } from "@/types";

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
  return (
    <>
      {/* AI Resume Section */}
      <Card className="p-4 border rounded-md">
        <AiResume 
          noteId={noteId}
          content={content}
          initialSummary={initialSummary}
          onSummaryGenerated={onSummaryGenerated}
        />
      </Card>
      
      {/* Trade Info Section - Only displayed for trading categories */}
      {isTradingCategory && (
        <Card className="p-4 border rounded-md">
          <TradeInfoSection 
            availableTokens={availableTokens}
            isLoadingTokens={isLoadingTokens}
            tradeInfo={tradeInfo}
            onTradeInfoChange={onTradeInfoChange}
            noteContent={content}
          />
        </Card>
      )}
    </>
  );
};

export default SpecialSections;
