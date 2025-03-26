
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
