import { supabase } from "@/integrations/supabase/client";
import { Token } from "@/types";

// Fetch tokens linked to a specific note
export const getTokensForNote = async (noteId: string): Promise<Token[]> => {
  try {
    const { data, error } = await supabase
      .from('notes_tokens')
      .select(`
        token_id,
        tokens:token_id (*)
      `)
      .eq('note_id', noteId);

    if (error) {
      console.error("Error fetching tokens for note:", error);
      return [];
    }

    // Transform the data to get token objects
    return data.map(item => item.tokens);
  } catch (error) {
    console.error("Error fetching tokens for note:", error);
    return [];
  }
};

// Link a token to a note
export const linkTokenToNote = async (noteId: string, tokenId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes_tokens')
      .insert({
        note_id: noteId,
        token_id: tokenId
      });

    if (error) {
      console.error('Error linking token to note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error linking token to note:', error);
    return false;
  }
};

// Unlink a token from a note
export const unlinkTokenFromNote = async (noteId: string, tokenId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes_tokens')
      .delete()
      .match({ note_id: noteId, token_id: tokenId });

    if (error) {
      console.error('Error unlinking token from note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unlinking token from note:', error);
    return false;
  }
};
