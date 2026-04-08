
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "@/types";

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
