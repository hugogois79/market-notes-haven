import { useState, useEffect } from 'react';
import { KanbanService, KanbanBoard, KanbanList, KanbanCard } from '@/services/kanbanService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useKanban = (boardId?: string) => {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [lists, setLists] = useState<KanbanList[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    if (boardId) {
      fetchBoardData(boardId);
      subscribeToChanges(boardId);
    }
  }, [boardId]);

  const fetchBoards = async () => {
    try {
      const data = await KanbanService.getBoards();
      setBoards(data);
    } catch (error: any) {
      toast.error('Failed to load boards: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardData = async (id: string) => {
    try {
      setLoading(true);
      const [listsData, cardsData] = await Promise.all([
        KanbanService.getLists(id),
        KanbanService.getCardsByBoard(id)
      ]);
      setLists(listsData);
      setCards(cardsData);
    } catch (error: any) {
      toast.error('Failed to load board data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = (id: string) => {
    const channel = supabase
      .channel(`board:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_cards' },
        () => {
          if (boardId) fetchBoardData(boardId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kanban_lists' },
        () => {
          if (boardId) fetchBoardData(boardId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'kanban_lists' },
        () => {
          if (boardId) fetchBoardData(boardId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      setCards(cards.map(c => c.id === id ? updated : c));
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
      if (boardId) fetchBoardData(boardId);
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
      if (boardId) fetchBoardData(boardId);
    }
  };

  return {
    boards,
    lists,
    cards,
    loading,
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
    refetch: () => boardId && fetchBoardData(boardId)
  };
};
