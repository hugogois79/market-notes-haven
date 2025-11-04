import React, { useState } from 'react';
import { KanbanSpace } from '@/services/kanbanService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FolderKanban, Edit, Trash } from 'lucide-react';
import { Card } from '@/components/ui/card';
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

interface SpaceManagerProps {
  spaces: KanbanSpace[];
  onCreateSpace: (space: Partial<KanbanSpace>) => Promise<KanbanSpace>;
  onUpdateSpace: (id: string, updates: Partial<KanbanSpace>) => Promise<void>;
  onDeleteSpace: (id: string) => Promise<void>;
  onSelectSpace: (spaceId: string) => void;
}

export const SpaceManager: React.FC<SpaceManagerProps> = ({
  spaces,
  onCreateSpace,
  onUpdateSpace,
  onDeleteSpace,
  onSelectSpace,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<KanbanSpace | null>(null);
  const [deletingSpace, setDeletingSpace] = useState<KanbanSpace | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0a4a6b');

  const handleCreate = async () => {
    try {
      await onCreateSpace({ title, description, color });
      setTitle('');
      setDescription('');
      setColor('#0a4a6b');
      setIsCreateOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = async () => {
    if (!editingSpace) return;
    try {
      await onUpdateSpace(editingSpace.id, { title, description, color });
      setEditingSpace(null);
      setTitle('');
      setDescription('');
      setColor('#0a4a6b');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!deletingSpace) return;
    try {
      await onDeleteSpace(deletingSpace.id);
      setDeletingSpace(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const openEditDialog = (space: KanbanSpace) => {
    setEditingSpace(space);
    setTitle(space.title);
    setDescription(space.description || '');
    setColor(space.color);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FolderKanban className="h-6 w-6" />
          Spaces
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Space
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Space</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Work Projects"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this space..."
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Space
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spaces.map((space) => (
          <Card
            key={space.id}
            className="p-4 cursor-pointer hover:border-primary transition-colors"
            style={{ borderColor: space.color + '40' }}
            onClick={() => onSelectSpace(space.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: space.color }}
                />
                <h3 className="font-semibold">{space.title}</h3>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(space);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingSpace(space);
                  }}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {space.description && (
              <p className="text-sm text-muted-foreground">{space.description}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSpace} onOpenChange={(open) => !open && setEditingSpace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Space</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Work Projects"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this space..."
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <Button onClick={handleEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSpace} onOpenChange={(open) => !open && setDeletingSpace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Space</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSpace?.title}"? Boards in this space will become unorganized but won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
