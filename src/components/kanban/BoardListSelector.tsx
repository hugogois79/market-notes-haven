import React, { useState, useEffect } from 'react';
import { KanbanBoard, KanbanList, KanbanService } from '@/services/kanbanService';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface BoardListSelectorProps {
  currentBoardId: string;
  currentListId: string;
  onBoardChange: (boardId: string) => void;
  onListChange: (listId: string) => void;
}

export const BoardListSelector: React.FC<BoardListSelectorProps> = ({
  currentBoardId,
  currentListId,
  onBoardChange,
  onListChange,
}) => {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [lists, setLists] = useState<KanbanList[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState(currentBoardId);
  const [selectedListId, setSelectedListId] = useState(currentListId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (selectedBoardId) {
      loadLists(selectedBoardId);
    }
  }, [selectedBoardId]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await KanbanService.getBoards();
      setBoards(data);
    } catch (error) {
      console.error('Error loading boards:', error);
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const loadLists = async (boardId: string) => {
    try {
      setLoading(true);
      const data = await KanbanService.getLists(boardId);
      setLists(data);
    } catch (error) {
      console.error('Error loading lists:', error);
      toast.error('Failed to load lists');
    } finally {
      setLoading(false);
    }
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    setSelectedListId(''); // Reset list selection when board changes
    onBoardChange(boardId);
  };

  const handleListChange = (listId: string) => {
    setSelectedListId(listId);
    onListChange(listId);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Board</Label>
        <Select value={selectedBoardId} onValueChange={handleBoardChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a board" />
          </SelectTrigger>
          <SelectContent>
            {boards.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: board.color || '#0a4a6b' }}
                  />
                  {board.title}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>List</Label>
        <Select 
          value={selectedListId} 
          onValueChange={handleListChange}
          disabled={!selectedBoardId || loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a list" />
          </SelectTrigger>
          <SelectContent>
            {lists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                <div className="flex items-center gap-2">
                  {list.color && (
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: list.color }}
                    />
                  )}
                  {list.title}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};