
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "@/types";

// Fetch all tags
export const fetchTags = async (): Promise<Tag[]> => {
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

    // Transform the data to match our Tag interface
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category || null
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Fetch tags by category
export const fetchTagsByCategory = async (category: string): Promise<Tag[]> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) {
      console.error(`Error fetching tags for category ${category}:`, error);
      return [];
    }

    // Transform the data to match our Tag interface
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category || null
    }));
  } catch (error) {
    console.error(`Error fetching tags for category ${category}:`, error);
    return [];
  }
};

// Create a new tag
export const createTag = async (tagName: string, category?: string | null): Promise<Tag | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Check if tag already exists
    const { data: existingTags, error: searchError } = await supabase
      .from('tags')
      .select('*')
      .eq('name', tagName)
      .limit(1);

    if (searchError) {
      console.error('Error searching for tag:', searchError);
      return null;
    }

    // If tag already exists, return it
    if (existingTags && existingTags.length > 0) {
      // If the tag exists but we're trying to update its category
      if (category !== undefined && existingTags[0].category !== category) {
        const { data: updatedTag, error: updateError } = await supabase
          .from('tags')
          .update({ category: category })
          .eq('id', existingTags[0].id)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error updating tag category:', updateError);
          // Return the existing tag with our interface structure
          return {
            id: existingTags[0].id,
            name: existingTags[0].name,
            category: existingTags[0].category || null
          };
        }
        
        // Return the updated tag with our interface structure
        return updatedTag ? {
          id: updatedTag.id,
          name: updatedTag.name,
          category: updatedTag.category || null
        } : null;
      }
      
      // Return the existing tag with our interface structure
      return {
        id: existingTags[0].id,
        name: existingTags[0].name,
        category: existingTags[0].category || null
      };
    }

    // Otherwise create a new tag
    const tagData: {
      name: string;
      user_id: string | undefined;
      category?: string | null;
    } = {
      name: tagName,
      user_id: userId
    };
    
    if (category !== undefined) {
      tagData.category = category;
    }
    
    const { data, error } = await supabase
      .from('tags')
      .insert([tagData])
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return null;
    }

    // Return the new tag with our interface structure
    return data ? {
      id: data.id,
      name: data.name,
      category: data.category || null
    } : null;
  } catch (error) {
    console.error('Error creating tag:', error);
    return null;
  }
};

// Update a tag's category
export const updateTagCategory = async (tagId: string, category: string | null): Promise<Tag | null> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .update({ category })
      .eq('id', tagId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tag category:', error);
      return null;
    }

    // Return the updated tag with our interface structure
    return data ? {
      id: data.id,
      name: data.name,
      category: data.category || null
    } : null;
  } catch (error) {
    console.error('Error updating tag category:', error);
    return null;
  }
};

// Get all available categories
export const fetchCategories = async (): Promise<string[]> => {
  try {
    // First, get all categories from notes table
    const { data: noteCategories, error: noteError } = await supabase
      .from('notes')
      .select('category')
      .not('category', 'is', null);

    if (noteError) {
      console.error('Error fetching note categories:', noteError);
      return [];
    }

    // Then, get all categories from tags table
    const { data: tagCategories, error: tagError } = await supabase
      .from('tags')
      .select('category')
      .not('category', 'is', null);

    if (tagError) {
      console.error('Error fetching tag categories:', tagError);
      return [];
    }

    // Merge both sets of categories and remove duplicates
    const allCategories = [
      ...noteCategories.map(item => item.category),
      ...tagCategories.map(item => item.category)
    ];
    
    // Extract unique categories and sort them
    const uniqueCategories = [...new Set(allCategories)].filter(Boolean) as string[];
    return uniqueCategories.sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Delete a tag
export const deleteTag = async (tagId: string): Promise<boolean> => {
  try {
    // First, remove all associations between the tag and notes
    const { error: unlinkError } = await supabase
      .from('notes_tags')
      .delete()
      .eq('tag_id', tagId);

    if (unlinkError) {
      console.error('Error unlinking tag from notes:', unlinkError);
      return false;
    }

    // Then, delete the tag itself
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

    // Transform the data to match our Tag interface
    return data.map(item => ({
      id: item.tags.id,
      name: item.tags.name,
      category: item.tags.category || null
    })) || [];
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

// Migrate existing tags from the notes.tags array to the notes_tags junction table
export const migrateExistingTags = async (): Promise<boolean> => {
  try {
    // Get all notes with tags
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, tags')
      .not('tags', 'is', null);

    if (notesError) {
      console.error('Error fetching notes for tag migration:', notesError);
      return false;
    }

    if (!notes || notes.length === 0) {
      console.log('No notes with tags found for migration');
      return true;
    }

    let success = true;

    // Process each note
    for (const note of notes) {
      if (!note.tags || note.tags.length === 0) continue;

      // Process each tag in the note
      for (const tagName of note.tags) {
        // Check if tag already exists
        let { data: existingTags, error: searchError } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .limit(1);

        if (searchError) {
          console.error(`Error searching for tag '${tagName}':`, searchError);
          success = false;
          continue;
        }

        let tagId: string;

        // If tag doesn't exist, create it
        if (!existingTags || existingTags.length === 0) {
          const { data: newTag, error: createError } = await supabase
            .from('tags')
            .insert([{ name: tagName }])
            .select('id')
            .single();

          if (createError || !newTag) {
            console.error(`Error creating tag '${tagName}':`, createError);
            success = false;
            continue;
          }

          tagId = newTag.id;
        } else {
          tagId = existingTags[0].id;
        }

        // Check if the note-tag link already exists
        const { data: existingLinks, error: linkCheckError } = await supabase
          .from('notes_tags')
          .select('id')
          .eq('note_id', note.id)
          .eq('tag_id', tagId);

        if (linkCheckError) {
          console.error(`Error checking if note-tag link exists:`, linkCheckError);
          success = false;
          continue;
        }

        // Only create the link if it doesn't exist
        if (!existingLinks || existingLinks.length === 0) {
          const { error: linkError } = await supabase
            .from('notes_tags')
            .insert([{
              note_id: note.id,
              tag_id: tagId
            }]);

          if (linkError) {
            console.error(`Error linking tag '${tagName}' to note:`, linkError);
            success = false;
          }
        }
      }
    }

    return success;
  } catch (error) {
    console.error('Error migrating tags:', error);
    return false;
  }
};
