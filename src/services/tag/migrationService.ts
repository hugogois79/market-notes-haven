
import { supabase } from "@/integrations/supabase/client";

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
