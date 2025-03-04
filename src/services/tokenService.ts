
import { supabase } from "@/integrations/supabase/client";
import { Token, Note } from "@/types";
import { dbNoteToNote } from "@/services/supabaseService";

// Convert database token to app token format
const dbTokenToToken = (dbToken: any): Token => ({
  id: dbToken.id,
  name: dbToken.name,
  symbol: dbToken.symbol,
  logo_url: dbToken.logo_url,
  description: dbToken.description,
  industry: dbToken.industry,
  tags: dbToken.tags,
  createdAt: new Date(dbToken.created_at),
  updatedAt: new Date(dbToken.updated_at),
});

// Fetch all tokens
export const fetchTokens = async (): Promise<Token[]> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order('name');

    if (error) {
      console.error("Error fetching tokens:", error);
      return [];
    }

    return (data || []).map(dbTokenToToken);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return [];
  }
};

// Fetch a single token by ID
export const fetchTokenById = async (tokenId: string): Promise<Token | null> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (error) {
      console.error("Error fetching token:", error);
      return null;
    }

    return dbTokenToToken(data);
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
};

// Create a new token
export const createToken = async (token: Omit<Token, 'id' | 'createdAt' | 'updatedAt'>): Promise<Token | null> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .insert([{
        name: token.name,
        symbol: token.symbol,
        logo_url: token.logo_url,
        description: token.description,
        industry: token.industry,
        tags: token.tags
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating token:", error);
      return null;
    }

    return dbTokenToToken(data);
  } catch (error) {
    console.error("Error creating token:", error);
    return null;
  }
};

// Update an existing token
export const updateToken = async (token: Token): Promise<Token | null> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .update({
        name: token.name,
        symbol: token.symbol,
        logo_url: token.logo_url,
        description: token.description,
        industry: token.industry,
        tags: token.tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', token.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating token:", error);
      return null;
    }

    return dbTokenToToken(data);
  } catch (error) {
    console.error("Error updating token:", error);
    return null;
  }
};

// Delete a token
export const deleteToken = async (tokenId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tokens')
      .delete()
      .eq('id', tokenId);

    if (error) {
      console.error("Error deleting token:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting token:", error);
    return false;
  }
};

// Fetch notes linked to a specific token
export const getNotesForToken = async (tokenId: string): Promise<Note[]> => {
  try {
    const { data, error } = await supabase
      .from('notes_tokens')
      .select(`
        note_id,
        notes:note_id (*)
      `)
      .eq('token_id', tokenId);

    if (error) {
      console.error("Error fetching notes for token:", error);
      return [];
    }

    // Transform the data to get note objects
    return data
      .filter(item => item.notes) // Filter out any null notes
      .map(item => dbNoteToNote(item.notes));
  } catch (error) {
    console.error("Error fetching notes for token:", error);
    return [];
  }
};

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
    return data
      .filter(item => item.tokens) // Filter out any null tokens
      .map(item => dbTokenToToken(item.tokens));
  } catch (error) {
    console.error("Error fetching tokens for note:", error);
    return [];
  }
};

// Link a token to a note
export const linkTokenToNote = async (noteId: string, tokenId: string): Promise<boolean> => {
  try {
    // First check if the link already exists
    const { data: existingLink, error: checkError } = await supabase
      .from('notes_tokens')
      .select('*')
      .eq('note_id', noteId)
      .eq('token_id', tokenId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing link:', checkError);
      return false;
    }
    
    // If the link already exists, return true
    if (existingLink) {
      return true;
    }
    
    // Create the link
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
