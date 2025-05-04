
import { supabase } from "@/integrations/supabase/client";
import { Tag } from '@/types';
import { toast } from 'sonner';

// Create a note-tag association
export const createNoteTag = async ({ noteId, tagName }: { noteId: string, tagName: string }) => {
  try {
    // First check if tag already exists
    const { data: existingTag, error: tagSearchError } = await supabase
      .from('tags')
      .select('*')
      .eq('name', tagName)
      .single();
    
    if (tagSearchError && tagSearchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Error searching for tag: ${tagSearchError.message}`);
    }
    
    let tagId;
    
    // If tag doesn't exist, create it
    if (!existingTag) {
      const { data: newTag, error: createError } = await supabase
        .from('tags')
        .insert({ name: tagName })
        .select()
        .single();
        
      if (createError) {
        throw new Error(`Error creating tag: ${createError.message}`);
      }
      
      tagId = newTag.id;
    } else {
      tagId = existingTag.id;
    }
    
    // Create note-tag association
    const { error: associationError } = await supabase
      .from('notes_tags')
      .insert({ note_id: noteId, tag_id: tagId });
      
    if (associationError) {
      throw new Error(`Error associating tag with note: ${associationError.message}`);
    }
    
    return { tagId, tagName };
  } catch (error) {
    console.error('Error in createNoteTag:', error);
    throw error;
  }
};

// Delete a note-tag association
export const deleteNoteTag = async ({ noteId, tagId }: { noteId: string, tagId: string }) => {
  try {
    const { error } = await supabase
      .from('notes_tags')
      .delete()
      .match({ note_id: noteId, tag_id: tagId });
      
    if (error) {
      throw new Error(`Error removing tag from note: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteNoteTag:', error);
    throw error;
  }
};

// Get all tags for a note
export const getNoteTags = async (noteId: string): Promise<Tag[]> => {
  try {
    const { data, error } = await supabase
      .from('notes_tags')
      .select('tags:tag_id(id, name, category, categories)')
      .eq('note_id', noteId);
      
    if (error) {
      throw new Error(`Error fetching note tags: ${error.message}`);
    }
    
    // Extract tags from the nested structure
    return data.map(item => item.tags as Tag) || [];
  } catch (error) {
    console.error('Error in getNoteTags:', error);
    toast.error('Failed to fetch tags');
    return [];
  }
};
