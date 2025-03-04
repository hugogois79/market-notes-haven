
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/types";

// Type for our database notes with proper date fields
export interface DbNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// Convert database note to app note format
export const dbNoteToNote = (dbNote: DbNote): Note => ({
  id: dbNote.id,
  title: dbNote.title,
  content: dbNote.content,
  tags: dbNote.tags,
  category: dbNote.category,
  createdAt: new Date(dbNote.created_at),
  updatedAt: new Date(dbNote.updated_at),
});

// Convert app note to database format
export const noteToDbNote = (note: Note): Omit<DbNote, 'created_at' | 'updated_at'> => ({
  id: note.id,
  title: note.title,
  content: note.content,
  tags: note.tags,
  category: note.category,
  user_id: null, // Will be set by the service
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

// Create a new note in Supabase
export const createNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    console.log('Creating note with content:', note.content);

    const { data, error } = await supabase
      .from('notes')
      .insert([{
        title: note.title,
        content: note.content, // Ensure content is included here
        tags: note.tags,
        category: note.category,
        user_id: userId,
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

    const { data, error } = await supabase
      .from('notes')
      .update({
        title: note.title,
        content: note.content, // Ensure content is included here
        tags: note.tags,
        category: note.category,
        updated_at: new Date().toISOString(),
        user_id: userId,
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
export const getUserProfile = async () => {
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
export const updateUserProfile = async (profile: any) => {
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
