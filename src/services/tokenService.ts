
import { supabase } from "@/integrations/supabase/client";
import { Token, Trader, TokenPortfolio, TokenTrader, TokenNote } from "@/types";

// Convert database token to app token format
export const dbTokenToToken = (dbToken: any): Token => ({
  id: dbToken.id,
  name: dbToken.name,
  symbol: dbToken.symbol,
  logo_url: dbToken.logo_url,
  description: dbToken.description,
  industry: dbToken.industry,
  tags: dbToken.tags || [],
  createdAt: new Date(dbToken.created_at),
  updatedAt: new Date(dbToken.updated_at),
});

// Convert database trader to app trader format
export const dbTraderToTrader = (dbTrader: any): Trader => ({
  id: dbTrader.id,
  name: dbTrader.name,
  avatar_url: dbTrader.avatar_url,
  bio: dbTrader.bio,
  contact_info: dbTrader.contact_info,
  createdAt: new Date(dbTrader.created_at),
  updatedAt: new Date(dbTrader.updated_at),
});

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

    return (data || []).map(dbTokenToToken);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
};

// Fetch a single token by ID
export const fetchToken = async (id: string): Promise<Token | null> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching token:', error);
      return null;
    }

    return dbTokenToToken(data);
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
        tags: token.tags || [],
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating token:', error);
      return null;
    }

    return dbTokenToToken(data);
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
      })
      .eq('id', token.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating token:', error);
      return null;
    }

    return dbTokenToToken(data);
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

// Fetch all traders
export const fetchTraders = async (): Promise<Trader[]> => {
  try {
    const { data, error } = await supabase
      .from('traders')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching traders:', error);
      return [];
    }

    return (data || []).map(dbTraderToTrader);
  } catch (error) {
    console.error('Error fetching traders:', error);
    return [];
  }
};

// Fetch traders for a token
export const fetchTradersForToken = async (tokenId: string): Promise<Trader[]> => {
  try {
    const { data, error } = await supabase
      .from('traders_tokens')
      .select('trader_id')
      .eq('token_id', tokenId);

    if (error) {
      console.error('Error fetching traders for token:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const traderIds = data.map(item => item.trader_id);

    const { data: tradersData, error: tradersError } = await supabase
      .from('traders')
      .select('*')
      .in('id', traderIds)
      .order('name');

    if (tradersError) {
      console.error('Error fetching traders details:', tradersError);
      return [];
    }

    return (tradersData || []).map(dbTraderToTrader);
  } catch (error) {
    console.error('Error fetching traders for token:', error);
    return [];
  }
};

// Link a trader to a token
export const linkTraderToToken = async (traderId: string, tokenId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('traders_tokens')
      .insert([{
        trader_id: traderId,
        token_id: tokenId,
      }]);

    if (error) {
      console.error('Error linking trader to token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error linking trader to token:', error);
    return false;
  }
};

// Unlink a trader from a token
export const unlinkTraderFromToken = async (traderId: string, tokenId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('traders_tokens')
      .delete()
      .match({ trader_id: traderId, token_id: tokenId });

    if (error) {
      console.error('Error unlinking trader from token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unlinking trader from token:', error);
    return false;
  }
};

// Link a note to a token
export const linkNoteToToken = async (noteId: string, tokenId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes_tokens')
      .insert([{
        note_id: noteId,
        token_id: tokenId,
      }]);

    if (error) {
      console.error('Error linking note to token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error linking note to token:', error);
    return false;
  }
};

// Get notes linked to a token
export const getNotesForToken = async (tokenId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('notes_tokens')
      .select('note_id')
      .eq('token_id', tokenId);

    if (error) {
      console.error('Error fetching notes for token:', error);
      return [];
    }

    return (data || []).map(item => item.note_id);
  } catch (error) {
    console.error('Error fetching notes for token:', error);
    return [];
  }
};
