import { supabase } from "@/integrations/supabase/client";
import { Tag } from "@/types";
import { getCategoriesForTag } from "./tagCategoryService";

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
