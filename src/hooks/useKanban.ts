import { useState, useEffect, useRef, useCallback } from 'react';
import { KanbanService, KanbanBoard, KanbanList, KanbanCard, KanbanSpace } from '@/services/kanbanService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useKanban = (boardId?: string, spaceId?: string | null) => {
  const [spaces, setSpaces] = useState<KanbanSpace[]>([]);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [allBoards, setAllBoards] = useState<KanbanBoard[]>([]);
  const [lists, setLists] = useState<KanbanList[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Refs to avoid stale closures in subscriptions
  const boardIdRef = useRef(boardId);
  const showArchivedRef = useRef(showArchived);
  boardIdRef.current = boardId;
  showArchivedRef.current = showArchived;

  useEffect(() => {
    fetchSpaces();
    fetchBoards(spaceId);
    fetchAllBoards();
  }, [spaceId]);

  useEffect(() => {
    if (boardId) {
      fetchBoardData(boardId, showArchived);

      // Subscribe and capture cleanup
      const channel = supabase
        .channel(`board:${boardId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kanban_cards' },
          () => {
            const currentBoardId = boardIdRef.current;
            if (currentBoardId) fetchBoardData(currentBoardId, showArchivedRef.current);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'kanban_lists' },
          () => {
            const currentBoardId = boardIdRef.current;
            if (currentBoardId) fetchBoardData(currentBoardId, showArchivedRef.current);
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'kanban_lists' },
          () => {
            const currentBoardId = boardIdRef.current;
            if (currentBoardId) fetchBoardData(currentBoardId, showArchivedRef.current);
          }
        )
        .subscribe();

      // Cleanup: remove channel when boardId/showArchived changes or component unmounts
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [boardId, showArchived]);

  const fetchSpaces = async () => {
    try {
      const data = await KanbanService.getSpaces();
      setSpaces(data);
    } catch (error: any) {
      toast.error('Failed to load spaces: ' + error.message);
    }
  };

  const fetchBoards = async (filterSpaceId?: string | null) => {
    try {
      const data = await KanbanService.getBoards(filterSpaceId);
      setBoards(data);
    } catch (error: any) {
      toast.error('Failed to load boards: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBoards = async () => {
    try {
      const data = await KanbanService.getBoards();
      setAllBoards(data);
    } catch (error: any) {
      // Silent fail - this is for SpaceManager only
      console.error('Failed to load all boards:', error);
    }
  };

  const fetchBoardData = async (id: string, includeArchived: boolean = false) => {
    try {
      setLoading(true);
      const [listsData, cardsData] = await Promise.all([
        KanbanService.getLists(id),
        KanbanService.getCardsByBoard(id, includeArchived)
      ]);
      setLists(listsData);
      setCards(cardsData);
    } catch (error: any) {
      toast.error('Failed to load board data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (board: Partial<KanbanBoard>) => {
    try {
      const newBoard = await KanbanService.createBoard(board);
      setBoards([newBoard, ...boards]);
      toast.success('Board created successfully');
      return newBoard;
    } catch (error: any) {
      toast.error('Failed to create board: ' + error.message);
      throw error;
    }
  };

  const updateBoard = async (id: string, updates: Partial<KanbanBoard>) => {
    try {
      const updated = await KanbanService.updateBoard(id, updates);
      setBoards(boards.map(b => b.id === id ? updated : b));
      toast.success('Board updated successfully');
    } catch (error: any) {
      toast.error('Failed to update board: ' + error.message);
    }
  };

  const deleteBoard = async (id: string) => {
    try {
      await KanbanService.deleteBoard(id);
      setBoards(boards.filter(b => b.id !== id));
      toast.success('Board deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete board: ' + error.message);
    }
  };

  const createList = async (list: Partial<KanbanList>) => {
    try {
      const newList = await KanbanService.createList(list);
      setLists([...lists, newList]);
      toast.success('List created successfully');
      return newList;
    } catch (error: any) {
      toast.error('Failed to create list: ' + error.message);
      throw error;
    }
  };

  const updateList = async (id: string, updates: Partial<KanbanList>) => {
    try {
      const updated = await KanbanService.updateList(id, updates);
      setLists(lists.map(l => l.id === id ? updated : l));
      if (updates.color) {
        toast.success('List color updated');
      }
    } catch (error: any) {
      toast.error('Failed to update list: ' + error.message);
    }
  };

  const deleteList = async (id: string) => {
    try {
      await KanbanService.deleteList(id);
      setLists(lists.filter(l => l.id !== id));
      toast.success('List deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete list: ' + error.message);
    }
  };

  const createCard = async (card: Partial<KanbanCard>) => {
    try {
      const newCard = await KanbanService.createCard(card);
      setCards([...cards, newCard]);
      toast.success('Card created successfully');
      return newCard;
    } catch (error: any) {
      toast.error('Failed to create card: ' + error.message);
      throw error;
    }
  };

  const updateCard = async (id: string, updates: Partial<KanbanCard>) => {
    try {
      const updated = await KanbanService.updateCard(id, updates);
      
      // If card is marked as concluded and we're not showing archived, remove it from view
      if (updates.concluded && !showArchived) {
        setCards(prev => prev.filter(c => c.id !== id));
      } 
      // If card is being reopened (concluded: false), add it back if it's not in the list
      else if (updates.concluded === false) {
        const cardExists = cards.some(c => c.id === id);
        if (!cardExists) {
        // Refetch to get the updated card
        const currentBoardId = boardIdRef.current;
        if (currentBoardId) fetchBoardData(currentBoardId, showArchivedRef.current);
        } else {
          setCards(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
        }
      } 
      else {
        // Merge updates with existing card to ensure all fields are preserved
        setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates, ...updated } : c));
      }
    } catch (error: any) {
      toast.error('Failed to update card: ' + error.message);
    }
  };

  const deleteCard = async (id: string) => {
    try {
      await KanbanService.deleteCard(id);
      setCards(cards.filter(c => c.id !== id));
      toast.success('Card deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete card: ' + error.message);
    }
  };

  const moveCard = async (cardId: string, targetListId: string, newPosition: number) => {
    try {
      await KanbanService.moveCard(cardId, targetListId, newPosition);
      const currentBoardId = boardIdRef.current;
      if (currentBoardId) fetchBoardData(currentBoardId, showArchivedRef.current);
    } catch (error: any) {
      toast.error('Failed to move card: ' + error.message);
    }
  };

  const moveList = async (listId: string, newPosition: number) => {
    try {
      // Optimistically update the UI
      const updatedLists = [...lists];
      const listIndex = updatedLists.findIndex(l => l.id === listId);
      if (listIndex !== -1) {
        const [movedList] = updatedLists.splice(listIndex, 1);
        updatedLists.splice(newPosition, 0, movedList);
        
        // Update positions for all affected lists
        const updates = updatedLists.map((list, index) => ({
          ...list,
          position: index
        }));
        setLists(updates);
        
        // Persist to database
        await Promise.all(
          updates.map(list => KanbanService.moveList(list.id, list.position))
        );
      }
    } catch (error: any) {
      toast.error('Failed to move list: ' + error.message);
      // Revert on error
      const currentBoardId = boardIdRef.current;
      if (currentBoardId) fetchBoardData(currentBoardId, showArchivedRef.current);
    }
  };

  const createSpace = async (space: Partial<KanbanSpace>, boardIds: string[] = []) => {
    try {
      const newSpace = await KanbanService.createSpace(space);
      
      // Assign boards to the new space
      if (boardIds.length > 0) {
        await Promise.all(
          boardIds.map(boardId => 
            KanbanService.updateBoard(boardId, { space_id: newSpace.id })
          )
        );
        // Refresh boards to reflect changes
        fetchBoards(spaceId);
        fetchAllBoards();
      }
      
      setSpaces([newSpace, ...spaces]);
      toast.success('Space created successfully');
      return newSpace;
    } catch (error: any) {
      toast.error('Failed to create space: ' + error.message);
      throw error;
    }
  };

  const updateSpace = async (id: string, updates: Partial<KanbanSpace>, boardIds: string[] = []) => {
    try {
      const updated = await KanbanService.updateSpace(id, updates);
      
      // Update board assignments
      // First, remove all boards from this space
      const currentSpaceBoards = boards.filter(b => b.space_id === id);
      await Promise.all(
        currentSpaceBoards.map(board => 
          KanbanService.updateBoard(board.id, { space_id: null })
        )
      );
      
      // Then assign the selected boards to this space
      if (boardIds.length > 0) {
        await Promise.all(
          boardIds.map(boardId => 
            KanbanService.updateBoard(boardId, { space_id: id })
          )
        );
      }
      
      // Refresh boards to reflect changes
      fetchBoards(spaceId);
      fetchAllBoards();
      
      setSpaces(spaces.map(s => s.id === id ? updated : s));
      toast.success('Space updated successfully');
    } catch (error: any) {
      toast.error('Failed to update space: ' + error.message);
    }
  };

  const deleteSpace = async (id: string) => {
    try {
      await KanbanService.deleteSpace(id);
      setSpaces(spaces.filter(s => s.id !== id));
      toast.success('Space deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete space: ' + error.message);
    }
  };

  return {
    spaces,
    boards,
    allBoards,
    lists,
    cards,
    loading,
    showArchived,
    setShowArchived,
    createSpace,
    updateSpace,
    deleteSpace,
    createBoard,
    updateBoard,
    deleteBoard,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    moveList,
    refetch: () => boardIdRef.current && fetchBoardData(boardIdRef.current, showArchivedRef.current),
    refetchBoards: () => fetchBoards(spaceId)
  };
};
