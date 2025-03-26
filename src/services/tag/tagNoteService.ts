
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "@/types";

// Get all notes with a specific tag
export const getNotesForTag = async (tagId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('notes_tags')
      .select('note_id')
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error fetching notes for tag:', error);
      return [];
    }

    return data.map(item => item.note_id) || [];
  } catch (error) {
    console.error('Error fetching notes for tag:', error);
    return [];
  }
};

// Get all tags for a specific note
export const getTagsForNote = async (noteId: string): Promise<Tag[]> => {
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

    // Get all tags
    const tagIds = data.map(item => item.tag_id);
    
    // Get categories for each tag
    const tagsWithCategories = await Promise.all(data.map(async (item) => {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('tag_categories')
        .select('category')
        .eq('tag_id', item.tag_id);
      
      if (categoriesError) {
        console.error(`Error fetching categories for tag ${item.tag_id}:`, categoriesError);
        return {
          id: item.tags.id,
          name: item.tags.name,
          category: item.tags.category || null,
          categories: []
        };
      }
      
      return {
        id: item.tags.id,
        name: item.tags.name,
        category: item.tags.category || null,
        categories: categoriesData.map(c => c.category)
      };
    }));

    return tagsWithCategories;
  } catch (error) {
    console.error('Error fetching tags for note:', error);
    return [];
  }
};

// Link a tag to a note
export const linkTagToNote = async (noteId: string, tagId: string): Promise<boolean> => {
  try {
    // Check if the link already exists to avoid duplicates
    const { data: existingLinks, error: checkError } = await supabase
      .from('notes_tags')
      .select('*')
      .eq('note_id', noteId)
      .eq('tag_id', tagId);

    if (checkError) {
      console.error('Error checking existing tag link:', checkError);
      return false;
    }

    // If link already exists, return true (already linked)
    if (existingLinks && existingLinks.length > 0) {
      return true;
    }

    // Create the new link
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
