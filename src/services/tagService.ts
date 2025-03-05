
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// Fetch all tags
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

    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Create a new tag
export const createTag = async (name: string): Promise<Tag | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      toast.error("You must be logged in to create tags");
      return null;
    }

    const { data, error } = await supabase
      .from('tags')
      .insert([{
        name,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        toast.error(`Tag "${name}" already exists`);
      } else {
        toast.error("Failed to create tag");
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating tag:', error);
    toast.error("Failed to create tag");
    return null;
  }
};

// Delete a tag
export const deleteTag = async (tagId: string): Promise<boolean> => {
  try {
    // First remove all associations with notes
    const { error: junctionError } = await supabase
      .from('notes_tags')
      .delete()
      .eq('tag_id', tagId);

    if (junctionError) {
      console.error('Error removing tag associations:', junctionError);
      toast.error("Failed to remove tag associations");
      return false;
    }

    // Then delete the tag itself
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Error deleting tag:', error);
      toast.error("Failed to delete tag");
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting tag:', error);
    toast.error("Failed to delete tag");
    return false;
  }
};

// Associate a tag with a note
export const linkTagToNote = async (noteId: string, tagId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes_tags')
      .insert([{
        note_id: noteId,
        tag_id: tagId,
      }]);

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

// Remove a tag association from a note
export const unlinkTagFromNote = async (noteId: string, tagId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes_tags')
      .delete()
      .match({
        note_id: noteId,
        tag_id: tagId,
      });

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

    // Transform the data to extract tag objects
    return data.map(item => item.tags) as Tag[];
  } catch (error) {
    console.error('Error fetching tags for note:', error);
    return [];
  }
};

// Get all notes associated with a specific tag
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

    // Extract note IDs
    return data.map(item => item.note_id);
  } catch (error) {
    console.error('Error fetching notes for tag:', error);
    return [];
  }
};

// Migrate existing tags from notes table
export const migrateExistingTags = async (): Promise<boolean> => {
  try {
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      toast.error("You must be logged in to migrate tags");
      return false;
    }

    // Fetch all notes with tags
    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .select('id, tags')
      .not('tags', 'is', null)
      .neq('tags', '{}');

    if (notesError) {
      console.error('Error fetching notes with tags:', notesError);
      return false;
    }

    if (!notesData || notesData.length === 0) {
      console.log('No notes with tags found to migrate');
      return true;
    }

    // Extract all unique tags from notes
    const allTags = new Set<string>();
    notesData.forEach(note => {
      if (Array.isArray(note.tags)) {
        note.tags.forEach(tag => {
          if (tag) allTags.add(tag);
        });
      }
    });

    const uniqueTags = Array.from(allTags);
    console.log(`Found ${uniqueTags.length} unique tags to migrate`);

    // Create all tags in the new tags table
    for (const tagName of uniqueTags) {
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .insert([{
          name: tagName,
          user_id: userId,
        }])
        .select()
        .single();

      if (tagError) {
        // If tag already exists, that's okay, we'll fetch it
        if (tagError.code !== '23505') {
          console.error(`Error creating tag "${tagName}":`, tagError);
          continue;
        }
      }

      // Get the tag ID (either from the newly created tag or fetch it if it already exists)
      let tagId: string;
      if (tagData) {
        tagId = tagData.id;
      } else {
        // Fetch existing tag
        const { data: existingTag, error: fetchError } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single();

        if (fetchError || !existingTag) {
          console.error(`Error fetching existing tag "${tagName}":`, fetchError);
          continue;
        }
        tagId = existingTag.id;
      }

      // Link this tag to all notes that have it
      for (const note of notesData) {
        if (Array.isArray(note.tags) && note.tags.includes(tagName)) {
          const { error: linkError } = await supabase
            .from('notes_tags')
            .insert([{
              note_id: note.id,
              tag_id: tagId,
            }])
            .on_conflict('note_id, tag_id') // In case it already exists
            .do_nothing();

          if (linkError && linkError.code !== '23505') {
            console.error(`Error linking tag "${tagName}" to note ${note.id}:`, linkError);
          }
        }
      }
    }

    console.log('Tag migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error migrating tags:', error);
    toast.error("Failed to migrate tags");
    return false;
  }
};
