import { supabase } from "@/integrations/supabase/client";
import { Note, TradeInfo } from "@/types";

// Type for our database notes with proper date fields
export interface DbNote {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  attachment_url: string | null;
  trade_info: TradeInfo | null; // Added field for trade information
}

// Type for our user profile
export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  type: string | null;
  role: string | null;
  status: string | null;
  contact_info: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Convert database note to app note format
export const dbNoteToNote = (dbNote: DbNote): Note => ({
  id: dbNote.id,
  title: dbNote.title,
  content: dbNote.content || "", // Ensure content is never null/undefined
  summary: dbNote.summary || undefined, // Convert null to undefined
  tags: dbNote.tags || [],
  category: dbNote.category || "General",
  createdAt: new Date(dbNote.created_at),
  updatedAt: new Date(dbNote.updated_at),
  attachment_url: dbNote.attachment_url || undefined,
  tradeInfo: dbNote.trade_info || undefined, // Convert trade_info to tradeInfo
});

// Convert app note to database format
export const noteToDbNote = (note: Note): Omit<DbNote, 'created_at' | 'updated_at'> => ({
  id: note.id,
  title: note.title,
  content: note.content,
  summary: note.summary || null,
  tags: note.tags,
  category: note.category,
  user_id: null, // Will be set by the service
  attachment_url: note.attachment_url || null,
  trade_info: note.tradeInfo || null, // Convert tradeInfo to trade_info
});

// Fetch all notes from Supabase
export const fetchNotes = async (): Promise<Note[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return (data || []).map(dbNoteToNote);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

// Generate AI summary for note content
export const generateNoteSummary = async (content: string): Promise<string | null> => {
  try {
    if (!content.trim()) {
      return null;
    }

    const response = await supabase.functions.invoke('summarize-note', {
      body: {
        content: content,
        maxLength: 150
      }
    });

    if (response.error) {
      console.error("Error generating summary:", response.error);
      return null;
    }

    return response.data?.summary || null;
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
};

// Create a new note in Supabase
export const createNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    console.log('Creating note with content:', note.content);

    // Generate summary first
    const summary = await generateNoteSummary(note.content);
    console.log('Generated summary:', summary);

    const { data, error } = await supabase
      .from('notes')
      .insert([{
        title: note.title,
        content: note.content || "", // Ensure content is never null
        summary: summary, // Add the generated summary
        tags: note.tags || [],
        category: note.category || "General",
        user_id: userId,
        attachment_url: note.attachment_url || null,
        trade_info: note.tradeInfo || null, // Add trade info
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    console.log('Created note data:', data);
    return dbNoteToNote(data as DbNote);
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
};

// Update an existing note in Supabase
export const updateNote = async (note: Note): Promise<Note | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    console.log('Updating note with content:', note.content);

    // Generate new summary if content has changed
    const summary = await generateNoteSummary(note.content);
    console.log('Generated summary:', summary);

    const { data, error } = await supabase
      .from('notes')
      .update({
        title: note.title,
        content: note.content || "", // Ensure content is never null
        summary: summary, // Update the summary
        tags: note.tags || [],
        category: note.category || "General",
        updated_at: new Date().toISOString(),
        user_id: userId,
        attachment_url: note.attachment_url || null,
        trade_info: note.tradeInfo || null, // Update trade info
      })
      .eq('id', note.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return null;
    }

    console.log('Updated note data:', data);
    return dbNoteToNote(data as DbNote);
  } catch (error) {
    console.error('Error updating note:', error);
    return null;
  }
};

// Delete a note from Supabase
export const deleteNote = async (noteId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
};

// Get app settings from Supabase
export const getSettings = async (): Promise<any | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }

    // If no settings exist, create default settings
    if (!data) {
      return createDefaultSettings();
    }

    return data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
};

// Create default settings
export const createDefaultSettings = async (): Promise<any | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data, error } = await supabase
      .from('settings')
      .insert([{
        user_id: userId,
      }]) // Will use all the defaults defined in the database
      .select()
      .single();

    if (error) {
      console.error('Error creating default settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating default settings:', error);
    return null;
  }
};

// Update settings
export const updateSettings = async (settings: any): Promise<any | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data, error } = await supabase
      .from('settings')
      .update({
        theme: settings.theme,
        editor_settings: settings.editor_settings,
        layout_settings: settings.layout_settings,
        notification_settings: settings.notification_settings,
        privacy_settings: settings.privacy_settings,
        updated_at: new Date().toISOString(),
        user_id: userId,
      })
      .eq('id', settings.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating settings:', error);
    return null;
  }
};

// Get current user profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        type: profile.type,
        role: profile.role,
        status: profile.status,
        contact_info: profile.contact_info,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
};

// Get user linked tokens
export const getUserLinkedTokens = async (): Promise<any[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) return [];

    const { data, error } = await supabase
      .from('user_tokens')
      .select(`
        token_id,
        tokens:token_id (*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user tokens:', error);
      return [];
    }

    // Transform the data to get token objects
    return data.map(item => item.tokens);
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return [];
  }
};

// Link a token to a user
export const linkTokenToUser = async (tokenId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) return false;

    const { error } = await supabase
      .from('user_tokens')
      .insert({
        user_id: userId,
        token_id: tokenId
      });

    if (error) {
      console.error('Error linking token to user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error linking token to user:', error);
    return false;
  }
};

// Unlink a token from a user
export const unlinkTokenFromUser = async (tokenId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) return false;

    const { error } = await supabase
      .from('user_tokens')
      .delete()
      .match({ user_id: userId, token_id: tokenId });

    if (error) {
      console.error('Error unlinking token from user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unlinking token from user:', error);
    return false;
  }
};

// Upload a file to Supabase Storage and get the URL
export const uploadNoteAttachment = async (file: File, noteId: string): Promise<string | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      console.error('User not authenticated');
      return null;
    }
    
    // Create a unique file path using the noteId and original filename
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${noteId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('note_attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    
    // Get the public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from('note_attachments')
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

// Delete a file from Supabase Storage
export const deleteNoteAttachment = async (attachmentUrl: string): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const url = new URL(attachmentUrl);
    const pathParts = url.pathname.split('/');
    const bucketName = pathParts[1]; // e.g., "note_attachments"
    
    // Remove the bucket name from the path
    const filePath = pathParts.slice(2).join('/');
    
    if (!filePath) {
      console.error('Invalid attachment URL');
      return false;
    }
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get tags for a specific note
export const getTagsForNote = async (noteId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('notes_tags')
      .select(`
        tag_id,
        tags:tag_id (*)
      `)
      .eq('note_id', noteId);

    if (error) {
      console.error('Error fetching tags for note:', error);
      return [];
    }

    // Transform the data to get tag objects
    return data.map(item => item.tags);
  } catch (error) {
    console.error('Error fetching tags for note:', error);
    return [];
  }
};

// Fetch all tags from Supabase
export const fetchTags = async (): Promise<any[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Create a new tag in Supabase
export const createTag = async (tagName: string): Promise<any | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data, error } = await supabase
      .from('tags')
      .insert([{
        name: tagName,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating tag:', error);
    return null;
  }
};

// Link a tag to a note
export const linkTagToNote = async (noteId: string, tagId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes_tags')
      .insert({
        note_id: noteId,
        tag_id: tagId
      });

    if (error) {
      console.error('Error linking tag to note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error linking tag to note:', error);
    return false;
  }
};

// Unlink a tag from a note
export const unlinkTagFromNote = async (noteId: string, tagId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes_tags')
      .delete()
      .match({ note_id: noteId, tag_id: tagId });

    if (error) {
      console.error('Error unlinking tag from note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unlinking tag from note:', error);
    return false;
  }
};

// Get tokens for a specific note
export const getTokensForNote = async (noteId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('notes_tokens')
      .select(`
        token_id,
        tokens:token_id (*)
      `)
      .eq('note_id', noteId);

    if (error) {
      console.error('Error fetching tokens for note:', error);
      return [];
    }

    // Transform the data to get token objects
    return data.map(item => item.tokens);
  } catch (error) {
    console.error('Error fetching tokens for note:', error);
    return [];
  }
};

// Fetch all tokens from Supabase
export const fetchTokens = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tokens:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching tokens:', error);
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
