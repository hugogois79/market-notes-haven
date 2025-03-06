
import { supabase } from "@/integrations/supabase/client";
import { Note, Tag, TagNote } from "./tagService";
import { toast } from "sonner";

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
  attachment_url?: string; // New field for storing attachment URL
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  logo_url?: string;
  description?: string;
  industry?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  count?: number; // Add optional count property for UI display
}

export interface Trader {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  contact_info?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPortfolio {
  id: string;
  portfolio_id: string;
  token_id: string;
  created_at: Date;
}

export interface TokenTrader {
  id: string;
  trader_id: string;
  token_id: string;
  created_at: Date;
}

export interface TokenNote {
  id: string;
  note_id: string;
  token_id: string;
  created_at: Date;
}

export interface TagNote {
  id: string;
  note_id: string;
  tag_id: string;
  created_at: Date;
}

/**
 * Fetch all tags from the database
 */
export const fetchTags = async (): Promise<Tag[]> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
    
    return data as Tag[];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

/**
 * Create a new tag
 */
export const createTag = async (name: string): Promise<Tag | null> => {
  try {
    // Check if a tag with this name already exists
    const { data: existingTags, error: checkError } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', name)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing tags:', checkError);
      return null;
    }
    
    // If tag already exists, return it
    if (existingTags && existingTags.length > 0) {
      return existingTags[0] as Tag;
    }
    
    // Insert new tag
    const { data, error } = await supabase
      .from('tags')
      .insert([{ name }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tag:', error);
      return null;
    }
    
    return data as Tag;
  } catch (error) {
    console.error('Error creating tag:', error);
    return null;
  }
};

/**
 * Delete a tag by ID
 */
export const deleteTag = async (tagId: string): Promise<boolean> => {
  try {
    // First delete all tag_notes associations
    const { error: unlinkError } = await supabase
      .from('tag_notes')
      .delete()
      .eq('tag_id', tagId);
    
    if (unlinkError) {
      console.error('Error unlinking tag from notes:', unlinkError);
      return false;
    }
    
    // Then delete the tag
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);
    
    if (error) {
      console.error('Error deleting tag:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting tag:', error);
    return false;
  }
};

/**
 * Get all tags associated with a note
 */
export const getTagsForNote = async (noteId: string): Promise<Tag[]> => {
  try {
    const { data, error } = await supabase
      .from('tag_notes')
      .select('tags(*)')
      .eq('note_id', noteId);
    
    if (error) {
      console.error('Error fetching tags for note:', error);
      return [];
    }
    
    // Extract tags from the joined query
    const tags = data.map(item => item.tags as Tag);
    return tags;
  } catch (error) {
    console.error('Error fetching tags for note:', error);
    return [];
  }
};

/**
 * Get all notes associated with a tag
 */
export const getNotesForTag = async (tagId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('tag_notes')
      .select('note_id')
      .eq('tag_id', tagId);
    
    if (error) {
      console.error('Error fetching notes for tag:', error);
      return [];
    }
    
    // Extract note_ids from the results
    const noteIds = data.map(item => item.note_id);
    return noteIds;
  } catch (error) {
    console.error('Error fetching notes for tag:', error);
    return [];
  }
};

/**
 * Link a tag to a note
 */
export const linkTagToNote = async (noteId: string, tagId: string): Promise<boolean> => {
  try {
    // Check if the link already exists
    const { data: existingLinks, error: checkError } = await supabase
      .from('tag_notes')
      .select('*')
      .eq('note_id', noteId)
      .eq('tag_id', tagId)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing tag link:', checkError);
      return false;
    }
    
    // If link already exists, return success
    if (existingLinks && existingLinks.length > 0) {
      return true;
    }
    
    // Create the link
    const { error } = await supabase
      .from('tag_notes')
      .insert([{ note_id: noteId, tag_id: tagId }]);
    
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

/**
 * Unlink a tag from a note
 */
export const unlinkTagFromNote = async (noteId: string, tagId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tag_notes')
      .delete()
      .eq('note_id', noteId)
      .eq('tag_id', tagId);
    
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

/**
 * Migrate existing tags (from the tags array in notes) to the tag system
 */
export const migrateExistingTags = async (): Promise<boolean> => {
  try {
    // 1. Fetch all notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*');
    
    if (notesError) {
      console.error('Error fetching notes for migration:', notesError);
      return false;
    }
    
    // Process each note
    for (const note of notes) {
      if (!note.tags || !Array.isArray(note.tags) || note.tags.length === 0) {
        continue; // Skip notes without tags
      }
      
      // Process each tag in the note
      for (const tagName of note.tags) {
        if (!tagName || typeof tagName !== 'string') continue;
        
        // Create or get the tag
        const tag = await createTag(tagName.trim());
        if (!tag) continue;
        
        // Link tag to note
        await linkTagToNote(note.id, tag.id);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error migrating tags:', error);
    return false;
  }
};
