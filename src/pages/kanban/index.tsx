import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useKanban } from '@/hooks/useKanban';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Kanban as KanbanIcon, Archive } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

const KanbanPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const {
    boards,
    lists,
    cards,
    loading,
    showArchived,
    setShowArchived,
    createBoard,
    createList,
    createCard,
    updateCard,
    deleteCard,
    deleteList,
    updateList,
    moveCard,
    moveList
  } = useKanban(boardId);

  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentBoard = boards.find(b => b.id === boardId);

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    
    const query = searchQuery.toLowerCase();
    return cards.filter(card => 
      card.title.toLowerCase().includes(query) ||
      card.description?.toLowerCase().includes(query)
    );
  }, [cards, searchQuery]);

  const handleCreateBoard = async () => {
    try {
      const board = await createBoard({
        title: newBoardTitle,
        description: newBoardDescription
      });
      setNewBoardTitle('');
      setNewBoardDescription('');
      setIsCreateBoardOpen(false);
      navigate(`/kanban/${board.id}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAddList = async (title: string) => {
    if (!boardId) return;
    const maxPosition = lists.length > 0 ? Math.max(...lists.map(l => l.position)) : -1;
    await createList({
      title,
      board_id: boardId,
      position: maxPosition + 1
    });
  };

  const handleAddCard = async (listId: string, title: string) => {
    const listCards = cards.filter(c => c.list_id === listId);
    const maxPosition = listCards.length > 0 ? Math.max(...listCards.map(c => c.position)) : -1;
    await createCard({
      title,
      list_id: listId,
      position: maxPosition + 1
    });
  };

  const handleEditList = async (listId: string, title: string) => {
    await updateList(listId, { title });
  };

  const handleColorChange = async (listId: string, color: string) => {
    await updateList(listId, { color });
  };

  if (!boardId) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Project Boards</h1>
          <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    placeholder="e.g., DABINAR"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Describe your project..."
                  />
                </div>
                <Button onClick={handleCreateBoard} className="w-full">
                  Create Board
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map(board => (
              <div
                key={board.id}
                onClick={() => navigate(`/kanban/${board.id}`)}
                className="p-6 rounded-lg border-2 hover:border-primary cursor-pointer transition-colors"
                style={{ backgroundColor: board.color + '10' }}
              >
                <h3 className="text-xl font-bold mb-2">{board.title}</h3>
                {board.description && (
                  <p className="text-sm text-muted-foreground">{board.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && boards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No boards yet. Create your first board to get started!</p>
            <Button onClick={() => setIsCreateBoardOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Board
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 space-y-4">
        {/* Board selector and search bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <KanbanIcon className="h-6 w-6" />
            <Select value={boardId} onValueChange={(value) => navigate(`/kanban/${value}`)}>
              <SelectTrigger className="w-[280px]">
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

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="show-archived" className="text-sm cursor-pointer">
              Show Archived
            </Label>
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
          </div>
        </div>

        {/* Board title and description */}
        {currentBoard && (
          <div>
            <h1 className="text-3xl font-bold">{currentBoard.title}</h1>
            {currentBoard.description && (
              <p className="text-muted-foreground">{currentBoard.description}</p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-96 w-80 flex-shrink-0" />
          ))}
        </div>
      ) : (
        <KanbanBoard
          lists={[...lists].sort((a, b) => a.position - b.position)}
          cards={filteredCards}
          onAddList={handleAddList}
          onAddCard={handleAddCard}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onDeleteList={deleteList}
          onEditList={handleEditList}
          onColorChange={handleColorChange}
          onMoveCard={moveCard}
          onMoveList={moveList}
        />
      )}

      {searchQuery && filteredCards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cards found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default KanbanPage;
