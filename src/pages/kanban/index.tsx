import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const KanbanPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const {
    boards,
    lists,
    cards,
    loading,
    createBoard,
    createList,
    createCard,
    updateCard,
    deleteCard,
    deleteList,
    updateList,
    moveCard
  } = useKanban(boardId);

  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');

  const currentBoard = boards.find(b => b.id === boardId);

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
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/kanban')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Boards
        </Button>
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
          lists={lists}
          cards={cards}
          onAddList={handleAddList}
          onAddCard={handleAddCard}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onDeleteList={deleteList}
          onEditList={handleEditList}
          onMoveCard={moveCard}
        />
      )}
    </div>
  );
};

export default KanbanPage;
