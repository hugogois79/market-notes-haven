
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/types";

// Get TAO token from database
export const fetchTaoToken = async () => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('symbol', 'TAO')
      .single();

    if (error) {
      console.error("Error fetching TAO token:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching TAO token:", error);
    return null;
  }
};

// Ensure TAO token exists in database
export const ensureTaoTokenExists = async () => {
  // First check if TAO token already exists
  const existingToken = await fetchTaoToken();
  if (existingToken) {
    return existingToken;
  }

  // If not, create it
  try {
    const { data, error } = await supabase
      .from('tokens')
      .insert([{
        name: 'Bittensor TAO',
        symbol: 'TAO',
        description: 'Native token of the Bittensor network',
        industry: 'AI & Machine Learning',
        tags: ['AI', 'Machine Learning', 'Neural Networks'],
        logo_url: '/public/lovable-uploads/c8d2d749-4f6a-474b-9c41-456fc15ee692.png',
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating TAO token:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating TAO token:", error);
    return null;
  }
};

// Link a note to the TAO token
export const linkNoteToTaoToken = async (noteId: string) => {
  // First ensure TAO token exists
  const taoToken = await ensureTaoTokenExists();
  if (!taoToken) {
    console.error("Failed to find or create TAO token");
    return false;
  }

  try {
    // Check if link already exists
    const { data: existingLink, error: checkError } = await supabase
      .from('notes_tokens')
      .select('*')
      .eq('note_id', noteId)
      .eq('token_id', taoToken.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking note-token link:", checkError);
      return false;
    }

    // If link already exists, return true
    if (existingLink) {
      return true;
    }

    // Create the link
    const { error } = await supabase
      .from('notes_tokens')
      .insert({
        note_id: noteId,
        token_id: taoToken.id
      });

    if (error) {
      console.error("Error linking note to TAO token:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error linking note to TAO token:", error);
    return false;
  }
};

// Get TAO-related notes
export const getTaoNotes = async (): Promise<Note[]> => {
  try {
    // First get the TAO token
    const taoToken = await fetchTaoToken();
    if (!taoToken) {
      return [];
    }

    // Get notes linked to the TAO token
    const { data, error } = await supabase
      .from('notes_tokens')
      .select(`
        note_id,
        notes:note_id (*)
      `)
      .eq('token_id', taoToken.id);

    if (error) {
      console.error("Error fetching TAO notes:", error);
      return [];
    }

    // Transform the data to get note objects
    return data
      .filter(item => item.notes) // Filter out any null notes
      .map(item => {
        const note = item.notes as any;
        return {
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags || [],
          category: note.category || 'TAO',
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at),
          trade_info: note.trade_info,
        };
      });
  } catch (error) {
    console.error("Error fetching TAO notes:", error);
    return [];
  }
};
