import React, { useState, useEffect, useRef } from 'react';
import { KanbanCard, KanbanService, KanbanAttachment } from '@/services/kanbanService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar as CalendarIcon, Save, Trash2, Upload, File, X, Loader2, Paperclip, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { TaskChecklist, Task } from './TaskChecklist';

interface KanbanCardModalProps {
  card: KanbanCard;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<KanbanCard>) => void;
  onDelete: (id: string) => void;
}

export const KanbanCardModal: React.FC<KanbanCardModalProps> = ({
  card,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(card.priority || 'medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    card.due_date ? new Date(card.due_date) : undefined
  );
  const [attachments, setAttachments] = useState<KanbanAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (isOpen && card.id) {
      loadAttachments();
      // Load tasks from card metadata
      const cardTasks = (card as any).tasks;
      if (cardTasks && Array.isArray(cardTasks)) {
        setTasks(cardTasks);
      } else {
        setTasks([]);
      }
    }
  }, [isOpen, card.id]);

  const loadAttachments = async () => {
    try {
      const data = await KanbanService.getAttachments(card.id);
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} exceeds 50MB limit`);
        continue;
      }

      setIsUploading(true);
      try {
        await KanbanService.uploadAttachment(card.id, file);
        toast.success(`${file.name} uploaded successfully`);
        await loadAttachments();
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setIsUploading(false);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachment: KanbanAttachment) => {
    try {
      await KanbanService.deleteAttachment(attachment.id, attachment.file_url);
      toast.success('Attachment deleted');
      await loadAttachments();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return '🖼️';
    }
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    if (['zip', 'rar'].includes(ext || '')) return '🗜️';
    return '📎';
  };

  const handleSave = () => {
    onUpdate(card.id, {
      title,
      description,
      priority,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      tasks: tasks as any
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this card?')) {
      onDelete(card.id);
      onClose();
    }
  };

  const handleMarkComplete = () => {
    onUpdate(card.id, {
      concluded: true,
      completed: true,
      archived: true,
      completed_at: new Date().toISOString()
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold border-none p-0 focus-visible:ring-0"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              rows={4}
            />
          </div>

          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Priority</Label>
            <RadioGroup value={priority} onValueChange={(v: any) => setPriority(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="cursor-pointer">Low</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="cursor-pointer">High</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <TaskChecklist tasks={tasks} onTasksChange={setTasks} />
          </div>

          <div>
            <Label>Attachments</Label>
            <div className="space-y-2">
              {attachments.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
                    >
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-1 min-w-0 hover:underline"
                      >
                        <span className="text-lg">{getFileIcon(attachment.filename)}</span>
                        <span className="text-sm truncate">{attachment.filename}</span>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttachment(attachment)}
                        className="ml-2 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Add Attachment (max 50MB)
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            {!card.completed && (
              <Button onClick={handleMarkComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
