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

    // Get categories for each tag
    const tagsWithCategories = await Promise.all((data || []).map(async (tag) => {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('tag_categories')
        .select('category')
        .eq('tag_id', tag.id);
      
      if (categoriesError) {
        console.error(`Error fetching categories for tag ${tag.id}:`, categoriesError);
        return {
          id: tag.id,
          name: tag.name,
          categories: [],
          category: tag.category || null // Keep original category for backward compatibility
        };
      }
      
      return {
        id: tag.id,
        name: tag.name,
        categories: categoriesData.map(c => c.category),
        category: tag.category || null // Keep original category for backward compatibility
      };
    }));

    return tagsWithCategories;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Fetch tags by category
export const fetchTagsByCategory = async (category: string): Promise<Tag[]> => {
  try {
    // First get tags from the tag_categories junction table
    const { data: tagCategoriesData, error: tagCategoriesError } = await supabase
      .from('tag_categories')
      .select('tag_id')
      .eq('category', category);

    if (tagCategoriesError) {
      console.error(`Error fetching tag IDs for category ${category}:`, tagCategoriesError);
      return [];
    }

    const tagIds = tagCategoriesData.map(tc => tc.tag_id);
    
    // Also include tags with the legacy category field
    const { data: legacyTagsData, error: legacyTagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('category', category)
      .not('id', 'in', tagIds.length > 0 ? tagIds : ['00000000-0000-0000-0000-000000000000']);
      
    if (legacyTagsError) {
      console.error(`Error fetching legacy tags for category ${category}:`, legacyTagsError);
      return [];
    }
    
    // If no tags found from either source, return empty array
    if (tagIds.length === 0 && (!legacyTagsData || legacyTagsData.length === 0)) {
      return [];
    }
    
    // Get tags by IDs from tag_categories
    let tagsData: any[] = [];
    if (tagIds.length > 0) {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds)
        .order('name', { ascending: true });
        
      if (error) {
        console.error(`Error fetching tags for category ${category}:`, error);
      } else {
        tagsData = data || [];
      }
    }
    
    // Combine with legacy tags
    const allTags = [...tagsData, ...(legacyTagsData || [])];
    
    // Get all categories for each tag
    const tagsWithCategories = await Promise.all(allTags.map(async (tag) => {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('tag_categories')
        .select('category')
        .eq('tag_id', tag.id);
      
      if (categoriesError) {
        console.error(`Error fetching categories for tag ${tag.id}:`, categoriesError);
        return {
          id: tag.id,
          name: tag.name,
          categories: [],
          category: tag.category || null // Keep original category for backward compatibility
        };
      }
      
      return {
        id: tag.id,
        name: tag.name,
        categories: categoriesData.map(c => c.category),
        category: tag.category || null // Keep original category for backward compatibility
      };
    }));

    return tagsWithCategories;
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

    // If tag already exists, add the category if provided
    if (existingTags && existingTags.length > 0) {
      // If a category is provided, add it to tag_categories
      if (category) {
        const { error: categoryError } = await supabase
          .from('tag_categories')
          .upsert({
            tag_id: existingTags[0].id,
            category: category
          });
          
        if (categoryError) {
          console.error('Error adding category to existing tag:', categoryError);
        }
      }
      
      // Get all categories for this tag
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('tag_categories')
        .select('category')
        .eq('tag_id', existingTags[0].id);
        
      if (categoriesError) {
        console.error('Error fetching categories for tag:', categoriesError);
      }
      
      // Return the existing tag with our interface structure
      return {
        id: existingTags[0].id,
        name: existingTags[0].name,
        category: existingTags[0].category || null,
        categories: categoriesData?.map(c => c.category) || []
      };
    }

    // Otherwise create a new tag
    const tagData = {
      name: tagName,
      user_id: userId,
      category: category || null // Still maintain the original category field for backward compatibility
    };
    
    const { data, error } = await supabase
      .from('tags')
      .insert([tagData])
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return null;
    }

    // If category provided, add it to tag_categories
    if (category && data) {
      const { error: categoryError } = await supabase
        .from('tag_categories')
        .insert({
          tag_id: data.id,
          category: category
        });
        
      if (categoryError) {
        console.error('Error adding category to new tag:', categoryError);
      }
    }

    // Return the new tag with our interface structure
    return data ? {
      id: data.id,
      name: data.name,
      category: data.category || null,
      categories: category ? [category] : []
    } : null;
  } catch (error) {
    console.error('Error creating tag:', error);
    return null;
  }
};

// Add a category to a tag
export const addCategoryToTag = async (tagId: string, category: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tag_categories')
      .insert({
        tag_id: tagId,
        category: category
      });

    if (error) {
      console.error('Error adding category to tag:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding category to tag:', error);
    return false;
  }
};

// Remove a category from a tag
export const removeCategoryFromTag = async (tagId: string, category: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tag_categories')
      .delete()
      .eq('tag_id', tagId)
      .eq('category', category);

    if (error) {
      console.error('Error removing category from tag:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing category from tag:', error);
    return false;
  }
};

// Get categories for a tag
export const getCategoriesForTag = async (tagId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('tag_categories')
      .select('category')
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error fetching categories for tag:', error);
      return [];
    }

    return data.map(item => item.category);
  } catch (error) {
    console.error('Error fetching categories for tag:', error);
    return [];
  }
};

// Update a tag's category (legacy method - for backward compatibility)
export const updateTagCategory = async (tagId: string, category: string | null): Promise<Tag | null> => {
  try {
    // First, update the legacy category field
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

    // If category is provided, also add it to tag_categories
    if (category) {
      const { error: categoryError } = await supabase
        .from('tag_categories')
        .upsert({
          tag_id: tagId,
          category: category
        });
        
      if (categoryError) {
        console.error('Error adding category in junction table:', categoryError);
      }
    }

    // Get all categories for this tag
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('tag_categories')
      .select('category')
      .eq('tag_id', tagId);
      
    if (categoriesError) {
      console.error('Error fetching categories for tag:', categoriesError);
    }

    // Return the updated tag with our interface structure
    return data ? {
      id: data.id,
      name: data.name,
      category: data.category || null,
      categories: categoriesData?.map(c => c.category) || []
    } : null;
  } catch (error) {
    console.error('Error updating tag category:', error);
    return null;
  }
};

// Get all available categories
export const fetchCategories = async (): Promise<string[]> => {
  try {
    // Get categories from notes table
    const { data: noteCategories, error: noteError } = await supabase
      .from('notes')
      .select('category')
      .not('category', 'is', null);

    if (noteError) {
      console.error('Error fetching note categories:', noteError);
      return [];
    }

    // Get categories from tags table (legacy)
    const { data: tagCategories, error: tagError } = await supabase
      .from('tags')
      .select('category')
      .not('category', 'is', null);

    if (tagError) {
      console.error('Error fetching tag categories:', tagError);
      return [];
    }

    // Get categories from tag_categories table (new)
    const { data: newTagCategories, error: newTagError } = await supabase
      .from('tag_categories')
      .select('category')
      .not('category', 'is', null);

    if (newTagError) {
      console.error('Error fetching new tag categories:', newTagError);
      return [];
    }

    // Merge all categories and remove duplicates
    const allCategories = [
      ...noteCategories.map(item => item.category),
      ...tagCategories.map(item => item.category),
      ...newTagCategories.map(item => item.category)
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

    // Then, delete all categories for this tag
    const { error: categoriesError } = await supabase
      .from('tag_categories')
      .delete()
      .eq('tag_id', tagId);

    if (categoriesError) {
      console.error('Error deleting tag categories:', categoriesError);
      return false;
    }

    // Finally, delete the tag itself
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

