import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useKanban } from '@/hooks/useKanban';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { SpaceSelector } from '@/components/kanban/SpaceSelector';
import { SpaceManager } from '@/components/kanban/SpaceManager';
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
import { Plus, Search, Kanban as KanbanIcon, Archive, ArrowLeft, MoreVertical, Pencil, Trash2, ArchiveRestore } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const KanbanPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const spaceIdParam = searchParams.get('space');
  const viewParam = searchParams.get('view') || 'boards';
  const {
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
    createCard,
    updateCard,
    deleteCard,
    deleteList,
    updateList,
    moveCard,
    moveList,
    refetchBoards
  } = useKanban(boardId, spaceIdParam);

  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [selectedSpace, setSelectedSpace] = useState<string>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBoard, setEditingBoard] = useState<typeof boards[0] | null>(null);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [showArchivedBoards, setShowArchivedBoards] = useState(false);

  const currentBoard = boards.find(b => b.id === boardId);

  // Filter boards based on archived status
  const filteredBoards = useMemo(() => {
    return boards.filter(board => showArchivedBoards ? board.archived : !board.archived);
  }, [boards, showArchivedBoards]);

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
        description: newBoardDescription,
        space_id: selectedSpace === 'none' ? undefined : selectedSpace
      });
      setNewBoardTitle('');
      setNewBoardDescription('');
      setSelectedSpace('none');
      setIsCreateBoardOpen(false);
      navigate(`/kanban/${board.id}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditBoard = async () => {
    if (!editingBoard || !editingBoard.title.trim()) return;
    
    try {
      await updateBoard(editingBoard.id, {
        title: editingBoard.title,
        description: editingBoard.description,
      });
      setEditingBoard(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteBoard = async () => {
    if (!deletingBoardId) return;
    
    try {
      await deleteBoard(deletingBoardId);
      setDeletingBoardId(null);
      
      if (boardId === deletingBoardId) {
        navigate('/kanban');
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleArchiveBoard = async (board: typeof boards[0]) => {
    try {
      await updateBoard(board.id, {
        archived: !board.archived
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSpaceChange = (spaceId: string | null) => {
    if (spaceId === null) {
      searchParams.delete('space');
    } else {
      searchParams.set('space', spaceId);
    }
    setSearchParams(searchParams);
  };

  const handleSpaceSelect = (spaceId: string) => {
    searchParams.set('space', spaceId);
    searchParams.set('view', 'boards');
    setSearchParams(searchParams);
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
        <Tabs value={viewParam} onValueChange={(v) => {
          searchParams.set('view', v);
          setSearchParams(searchParams);
        }}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="spaces">Spaces</TabsTrigger>
              <TabsTrigger value="boards">Boards</TabsTrigger>
            </TabsList>
            
            {viewParam === 'boards' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="show-archived-boards" className="text-sm cursor-pointer">
                    Show Archived
                  </Label>
                  <Switch
                    id="show-archived-boards"
                    checked={showArchivedBoards}
                    onCheckedChange={setShowArchivedBoards}
                  />
                </div>
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
                    <div>
                      <Label>Space (optional)</Label>
                      <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a space" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Space</SelectItem>
                          {spaces.map((space) => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateBoard} className="w-full">
                      Create Board
                    </Button>
                  </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          <TabsContent value="spaces">
            <SpaceManager
              spaces={spaces}
              boards={allBoards}
              onCreateSpace={createSpace}
              onUpdateSpace={updateSpace}
              onDeleteSpace={deleteSpace}
              onSelectSpace={handleSpaceSelect}
            />
          </TabsContent>

          <TabsContent value="boards">
            <div className="space-y-6">
              <SpaceSelector
                spaces={spaces}
                currentSpaceId={spaceIdParam}
                onSpaceChange={handleSpaceChange}
              />

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBoards.map(board => (
                    <div
                      key={board.id}
                      onClick={() => navigate(`/kanban/${board.id}`)}
                      className="p-6 rounded-lg border-2 hover:border-primary cursor-pointer transition-colors relative group"
                      style={{ backgroundColor: board.color + '10' }}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setEditingBoard(board);
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Board
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveBoard(board);
                              }}
                            >
                              {board.archived ? (
                                <>
                                  <ArchiveRestore className="h-4 w-4 mr-2" />
                                  Unarchive Board
                                </>
                              ) : (
                                <>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive Board
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingBoardId(board.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Board
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="text-xl font-bold mb-2 pr-8">{board.title}</h3>
                      {board.description && (
                        <p className="text-sm text-muted-foreground">{board.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!loading && filteredBoards.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {showArchivedBoards 
                      ? 'No archived boards.' 
                      : spaceIdParam 
                        ? 'No boards in this space yet.' 
                        : 'No boards yet. Create your first board to get started!'}
                  </p>
                  <Button onClick={() => setIsCreateBoardOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Board
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Board Dialog */}
        <Dialog open={!!editingBoard} onOpenChange={(open) => !open && setEditingBoard(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-board-title">Board Title</Label>
                <Input
                  id="edit-board-title"
                  value={editingBoard?.title || ""}
                  onChange={(e) => setEditingBoard(editingBoard ? { ...editingBoard, title: e.target.value } : null)}
                  placeholder="Enter board title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-board-description">Description (optional)</Label>
                <Textarea
                  id="edit-board-description"
                  value={editingBoard?.description || ""}
                  onChange={(e) => setEditingBoard(editingBoard ? { ...editingBoard, description: e.target.value } : null)}
                  placeholder="Enter board description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingBoard(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditBoard}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Board Confirmation */}
        <AlertDialog open={!!deletingBoardId} onOpenChange={(open) => !open && setDeletingBoardId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Board</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this board? This will also delete all lists and cards in this board. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBoard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 space-y-4">
        {/* Back button and board selector */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/kanban')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Boards
          </Button>
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
          boardId={boardId}
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
