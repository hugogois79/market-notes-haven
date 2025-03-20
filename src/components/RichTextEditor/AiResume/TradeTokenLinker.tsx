
import React from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TradeTokenLinkerProps {
  tradeInfo: any;
  noteId: string;
}

const TradeTokenLinker: React.FC<TradeTokenLinkerProps> = ({ tradeInfo, noteId }) => {
  
  const linkTokenToNote = async () => {
    if (!tradeInfo || !tradeInfo.allTrades || tradeInfo.allTrades.length === 0 || noteId.startsWith('temp-')) {
      return;
    }
    
    const firstTrade = tradeInfo.allTrades[0];
    if (!firstTrade || !firstTrade.tokenName) {
      return;
    }
    
    try {
      // Look up the token by name or symbol to get its ID
      const { data: tokenData, error: tokenError } = await supabase
        .from('tokens')
        .select('id')
        .or(`name.ilike.%${firstTrade.tokenName}%,symbol.ilike.%${firstTrade.tokenName}%`)
        .limit(1);
        
      if (tokenError) {
        console.error("Error finding token:", tokenError);
        return;
      }
      
      if (!tokenData || tokenData.length === 0) {
        console.log(`No token found for '${firstTrade.tokenName}'`);
        return;
      }
      
      const tokenId = tokenData[0].id;
      console.log(`Found token ID ${tokenId} for ${firstTrade.tokenName}`);
      
      // Check if this token is already linked to the note
      const { data: existingLink, error: checkError } = await supabase
        .from('notes_tokens')
        .select('*')
        .eq('note_id', noteId)
        .eq('token_id', tokenId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking existing token link:", checkError);
        return;
      }
      
      if (existingLink) {
        console.log(`Token ${tokenId} already linked to note ${noteId}`);
        return;
      }
      
      // Link the token to the note
      const { error: linkError } = await supabase
        .from('notes_tokens')
        .insert({
          note_id: noteId,
          token_id: tokenId
        });
        
      if (linkError) {
        console.error("Error linking token to note:", linkError);
        return;
      }
      
      console.log(`Successfully linked token ${tokenId} to note ${noteId}`);
      toast.success(`Token ${firstTrade.tokenName} linked to the note.`);
    } catch (error) {
      console.error("Error in token linking:", error);
    }
  };
  
  // This component doesn't render anything visible - it handles token linking logic
  React.useEffect(() => {
    linkTokenToNote();
  }, [tradeInfo]);
  
  return null;
};

export default TradeTokenLinker;
