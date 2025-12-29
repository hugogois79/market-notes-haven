import { supabase } from "@/integrations/supabase/client";
import { Note, TradeInfo } from "@/types";
import { Json } from "@/integrations/supabase/types";

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
  attachments: string[] | null; // Added attachments array field
  trade_info: Json | null; // Changed from TradeInfo to Json for Supabase compatibility
  has_conclusion: boolean | null;
  project_id: string | null; // Added project_id field
}

// Type for our user profile
export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  type: string | null;
  status: string | null;
  contact_info: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Helper functions to convert between TradeInfo and Json
const tradeInfoToJson = (tradeInfo: TradeInfo | undefined): Json | null => {
  if (!tradeInfo) return null;
  return tradeInfo as unknown as Json;
};

const jsonToTradeInfo = (json: Json | null): TradeInfo | undefined => {
  if (!json) return undefined;
  return json as unknown as TradeInfo;
};

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
  attachments: dbNote.attachments || (dbNote.attachment_url ? [dbNote.attachment_url] : []), // Handle attachments array
  tradeInfo: jsonToTradeInfo(dbNote.trade_info), // Convert JSON to TradeInfo
  hasConclusion: dbNote.has_conclusion, // Include hasConclusion field
  project_id: dbNote.project_id || undefined, // Include project_id
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
  attachments: note.attachments || [],  // Add attachments array to database
  trade_info: tradeInfoToJson(note.tradeInfo), // Convert TradeInfo to JSON
  has_conclusion: note.hasConclusion || null, // Add the has_conclusion field
  project_id: note.project_id || null, // Add project_id field
});

// Fetch all notes from Supabase
export const fetchNotes = async (): Promise<Note[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Select specific columns instead of * to avoid fetching the large embedding column
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, content, summary, tags, category, created_at, updated_at, user_id, attachment_url, attachments, trade_info, has_conclusion, project_id')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return (data || []).map(dbNote => dbNoteToNote(dbNote as DbNote));
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

// Generate AI summary for note content
export const generateNoteSummary = async (content: string, noteId?: string): Promise<string | null> => {
  try {
    if (!content.trim()) {
      return null;
    }

    const response = await supabase.functions.invoke('summarize-note', {
      body: {
        content: content,
        noteId,
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

// Generate embedding for note content using OpenAI
export const generateNoteEmbedding = async (title: string, content: string): Promise<number[] | null> => {
  try {
    // Strip HTML tags for cleaner text
    const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!title.trim() && !cleanContent.trim()) {
      console.log('No content to generate embedding');
      return null;
    }

    console.log('Generating embedding for note...');
    
    const response = await supabase.functions.invoke('embed-note', {
      body: {
        title: title,
        content: cleanContent
      }
    });

    if (response.error) {
      console.error("Error generating embedding:", response.error);
      return null;
    }

    const embedding = response.data?.embedding;
    if (embedding && Array.isArray(embedding)) {
      console.log(`Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    }

    return null;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
};

// Create a new note in Supabase
export const createNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ note: Note | null; embeddingFailed: boolean }> => {
  let embeddingFailed = false;
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    console.log('Creating note with content:', note.content);

    // Generate summary first
    const summary = await generateNoteSummary(note.content);
    console.log('Generated summary:', summary);

    // Generate embedding
    const embedding = await generateNoteEmbedding(note.title, note.content || '');
    if (!embedding) {
      console.warn('Failed to generate embedding for new note');
      embeddingFailed = true;
    }

    const dbNote: Record<string, unknown> = {
      title: note.title,
      content: note.content || "", // Ensure content is never null
      summary: summary, // Add the generated summary
      tags: note.tags || [],
      category: note.category || "General",
      user_id: userId,
      attachment_url: note.attachment_url || null,
      attachments: note.attachments || [], // Include all attachments
      trade_info: tradeInfoToJson(note.tradeInfo), // Convert TradeInfo to JSON
    };

    // Only add embedding if it was generated successfully
    if (embedding) {
      dbNote.embedding = JSON.stringify(embedding);
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([dbNote])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return { note: null, embeddingFailed };
    }

    console.log('Created note data:', data);
    return { note: dbNoteToNote(data as DbNote), embeddingFailed };
  } catch (error) {
    console.error('Error creating note:', error);
    return { note: null, embeddingFailed };
  }
};

// Update an existing note in Supabase
export const updateNote = async (note: Note): Promise<{ note: Note | null; embeddingFailed: boolean }> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    console.log('Updating note with content:', note.content);
    console.log('Updating note with summary:', note.summary);
    console.log('Updating note with attachments:', note.attachments);

    // Don't wait for summary generation - save immediately
    const summaryToSave = note.summary || null;

    // Ensure attachments array is properly formatted
    const attachments = note.attachments && Array.isArray(note.attachments) 
      ? note.attachments.slice(0, 20) // Limit to 20 items
      : (note.attachment_url ? [note.attachment_url] : []);

    console.log('Saving attachments:', attachments);

    const updateData: Record<string, unknown> = {
      title: note.title,
      content: note.content || "", // Ensure content is never null
      summary: summaryToSave,
      tags: note.tags || [],
      category: note.category,
      updated_at: new Date().toISOString(),
      user_id: userId,
      attachment_url: attachments.length > 0 ? attachments[0] : null,
      attachments: attachments,
      trade_info: tradeInfoToJson(note.tradeInfo),
      has_conclusion: note.hasConclusion,
      project_id: note.project_id
    };

    // Save the note immediately without waiting for embedding
    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', note.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return { note: null, embeddingFailed: false };
    }

    console.log('Updated note data:', data);
    const savedNote = dbNoteToNote(data as DbNote);

    // Generate embedding in the background (non-blocking)
    generateNoteEmbeddingInBackground(note.id, note.title, note.content || '');

    return { note: savedNote, embeddingFailed: false };
  } catch (error) {
    console.error('Error updating note:', error);
    return { note: null, embeddingFailed: false };
  }
};

// Generate embedding in background (non-blocking)
const generateNoteEmbeddingInBackground = (noteId: string, title: string, content: string) => {
  // Run embedding generation asynchronously without blocking the save
  (async () => {
    try {
      const embedding = await generateNoteEmbedding(title, content);
      if (embedding) {
        // Update the note with the embedding
        const { error } = await supabase
          .from('notes')
          .update({ embedding: JSON.stringify(embedding) })
          .eq('id', noteId);
        
        if (error) {
          console.error('Error updating note embedding:', error);
        } else {
          console.log('Note embedding updated successfully for:', noteId);
        }
      } else {
        console.warn('Failed to generate embedding for note:', noteId);
      }
    } catch (error) {
      console.error('Error in background embedding generation:', error);
    }
  })();
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

// Upload profile photo to avatars bucket
export const uploadProfilePhoto = async (file: File): Promise<string | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) return null;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type 
      });
    
    if (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
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
    
    // Create a safe filename by removing special characters and spaces
    const fileExt = file.name.split('.').pop();
    const baseFileName = file.name.replace(/\.[^/.]+$/, '');
    const safeFileName = `${baseFileName.replace(/[^\w-]/g, '_')}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${noteId}/${safeFileName}`;
    
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
