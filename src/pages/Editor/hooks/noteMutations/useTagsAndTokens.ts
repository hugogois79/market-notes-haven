
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag } from '@/types';
import { createNoteTag, deleteNoteTag, getNoteTags } from '@/services/noteTagsService';
import { toast } from 'sonner';

interface UseTagsAndTokensProps {
  noteId?: string;
  initialTags?: Tag[];
}

// Add a type guard to check if a value is not null or undefined
function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export const useTagsAndTokens = ({ noteId, initialTags = [] }: UseTagsAndTokensProps = {}) => {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const queryClient = useQueryClient();

  const { mutate: createTagMutation, isPending: isCreatingTag } = useMutation({
    mutationFn: createNoteTag,
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['note-tags', noteId] });
      toast.success('Tag created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });

  const { mutate: deleteTagMutation, isPending: isDeletingTag } = useMutation({
    mutationFn: deleteNoteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-tags', noteId] });
      toast.success('Tag deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete tag: ${error.message}`);
    },
  });

  const handleTagsChange = useCallback(
    (newTags: (Tag | string)[] = []) => {
      // Filter out null or undefined values first
      const validTags = newTags.filter(isNotNullOrUndefined);
      
      // Then map to Tag objects, handling both Tag objects and primitive strings
      // We need to ensure all objects conform to the Tag interface
      const formattedTags = validTags.map((tag) => {
        if (typeof tag === 'string') {
          return { id: `-1-${tag}`, name: tag } as Tag; // Temporary ID, will be replaced when saved
        }
        return tag as Tag;
      });
      
      setTags(formattedTags);
    },
    []
  );

  const addTag = useCallback(
    async (tagName: string) => {
      if (!noteId) {
        toast.error('Note ID is required to add a tag.');
        return;
      }

      createTagMutation({ noteId, tagName });
    },
    [createTagMutation, noteId]
  );

  const removeTag = useCallback(
    async (tagId: string) => {
      if (!noteId) {
        toast.error('Note ID is required to remove a tag.');
        return;
      }

      deleteTagMutation({ noteId, tagId });
    },
    [deleteTagMutation, noteId]
  );

  return {
    tags,
    linkedTags: tags, // Alias for backward compatibility
    linkedTokens: [], // Returning empty array for now as token handling seems to be in a different module
    handleTagsChange,
    handleTokensChange: () => {}, // Empty function for now
    addTag,
    removeTag,
    isCreatingTag,
    isDeletingTag,
  };
};
