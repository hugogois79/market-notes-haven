import { Token, TokenPortfolio, TokenTrader, TokenNote } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Fetch all tokens
export const fetchTokens = async (): Promise<Token[]> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching tokens:', error);
      return [];
    }

    return data.map(token => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      logo_url: token.logo_url,
      description: token.description,
      industry: token.industry,
      tags: token.tags,
      createdAt: new Date(token.created_at),
      updatedAt: new Date(token.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
};

// Fetch a single token by ID
export const fetchTokenById = async (id: string): Promise<Token | null> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching token:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      logo_url: data.logo_url,
      description: data.description,
      industry: data.industry,
      tags: data.tags,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error fetching token:', error);
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
      console.error('Error creating token:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      logo_url: data.logo_url,
      description: data.description,
      industry: data.industry,
      tags: data.tags,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error creating token:', error);
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
      console.error('Error updating token:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      logo_url: data.logo_url,
      description: data.description,
      industry: data.industry,
      tags: data.tags,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error updating token:', error);
    return null;
  }
};

// Delete a token
export const deleteToken = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tokens')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting token:', error);
    return false;
  }
};

// Get tokens for a note
export const getTokensForNote = async (noteId: string): Promise<Token[]> => {
  try {
    const { data, error } = await supabase
      .from('notes_tokens')
      .select('token_id')
      .eq('note_id', noteId);

    if (error) {
      console.error('Error fetching tokens for note:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const tokenIds = data.map(item => item.token_id);
    
    const { data: tokensData, error: tokensError } = await supabase
      .from('tokens')
      .select('*')
      .in('id', tokenIds);

    if (tokensError) {
      console.error('Error fetching tokens details:', tokensError);
      return [];
    }

    return tokensData.map(token => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      logo_url: token.logo_url,
      description: token.description,
      industry: token.industry,
      tags: token.tags,
      createdAt: new Date(token.created_at),
      updatedAt: new Date(token.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching tokens for note:', error);
    return [];
  }
};

// Link a token to a note
export const linkTokenToNote = async (noteId: string, tokenId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes_tokens')
      .insert([{
        note_id: noteId,
        token_id: tokenId
      }]);

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

// Alias for fetchTokenById to maintain compatibility with the token detail page
export const fetchToken = fetchTokenById;
