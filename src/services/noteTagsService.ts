
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
    // Query the notes_tags junction table to get tag IDs
    const { data: noteTagsData, error: noteTagsError } = await supabase
      .from('notes_tags')
      .select('tag_id')
      .eq('note_id', noteId);
      
    if (noteTagsError) {
      throw new Error(`Error fetching note tags: ${noteTagsError.message}`);
    }
    
    // If no tags are associated with the note, return empty array
    if (!noteTagsData || noteTagsData.length === 0) {
      return [];
    }
    
    // Extract tag IDs
    const tagIds = noteTagsData.map(item => item.tag_id);
    
    // Get tag details from the tags table
    // Only select fields we know exist in the tags table
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('id, name, category')
      .in('id', tagIds);
    
    if (tagsError) {
      throw new Error(`Error fetching tags details: ${tagsError.message}`);
    }
    
    if (!tagsData) {
      return [];
    }
    
    // Map the data to Tag objects, ensuring proper type safety
    return tagsData.map(tag => ({
      id: tag.id,
      name: tag.name,
      category: tag.category,
      categories: tag.categories || [] // Provide default empty array if categories is undefined
    }));
  } catch (error) {
    console.error('Error in getNoteTags:', error);
    toast.error('Failed to fetch tags');
    return [];
  }
};
