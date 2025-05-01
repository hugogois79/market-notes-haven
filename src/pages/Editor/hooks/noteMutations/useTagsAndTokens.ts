import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag } from '@/types';
import { createNoteTag, deleteNoteTag } from '@/services/noteTagsService';
import { toast } from 'sonner';

interface UseTagsAndTokensProps {
  noteId?: number;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-tags', noteId] });
      toast.success('Tag created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });

  const { mutate: deleteTagMutation, isPending: isDeletingTag } = useMutation({
    mutationFn: deleteNoteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-tags', noteId] });
      toast.success('Tag deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete tag: ${error.message}`);
    },
  });

  const handleTagsChange = useCallback(
    (newTags: (Tag | string)[] = []) => {
      // Filter out null or undefined values first
      const validTags = newTags.filter(isNotNullOrUndefined);
      
      // Then map to Tag objects, handling both Tag objects and primitive strings
      const formattedTags = validTags.map((tag) => {
        if (typeof tag === 'string') {
          return { name: tag };
        }
        return tag;
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
    async (tagId: number) => {
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
    handleTagsChange,
    addTag,
    removeTag,
    isCreatingTag,
    isDeletingTag,
  };
};
