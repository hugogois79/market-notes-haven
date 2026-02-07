import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Save, Trash2, Upload, File, X, Loader2, Paperclip, CheckCircle2, MoveRight, Download, Plus, Tag, Sparkles, Users, UserPlus, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { TaskChecklist, Task } from './TaskChecklist';
import { BoardListSelector } from './BoardListSelector';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AiTaskGeneratorDialog } from './AiTaskGeneratorDialog';
import { AiCardGeneratorDialog } from './AiCardGeneratorDialog';
import { AiAttachmentAnalyzerDialog } from './AiAttachmentAnalyzerDialog';

interface KanbanCardModalProps {
  card: KanbanCard;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<KanbanCard>) => void;
  onDelete: (id: string) => void;
  onMove?: (cardId: string, newListId: string, newBoardId: string) => void;
}

export const KanbanCardModal: React.FC<KanbanCardModalProps> = ({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onMove
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
  const [moveToListId, setMoveToListId] = useState<string>(card.list_id);
  const [moveToBoardId, setMoveToBoardId] = useState<string>(boardId);
  const [showMoveSection, setShowMoveSection] = useState(false);
  const [tags, setTags] = useState<string[]>((card as any).tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [value, setValue] = useState<number>(card.value || 0);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [showAiCardDialog, setShowAiCardDialog] = useState(false);
  const [showAiAttachmentDialog, setShowAiAttachmentDialog] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string[]>((card as any).assigned_to || []);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const assignDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch expense_users for assignment (same as Settings > Utilizadores)
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['expense-users-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_users')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(e.target as Node)) {
        setShowAssignDropdown(false);
      }
    };
    if (showAssignDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAssignDropdown]);

  const handleAddAssignee = (userId: string) => {
    if (!assignedTo.includes(userId)) {
      setAssignedTo([...assignedTo, userId]);
    }
    setShowAssignDropdown(false);
  };

  const handleRemoveAssignee = (userId: string) => {
    setAssignedTo(assignedTo.filter(id => id !== userId));
  };

  const getUserById = (userId: string) => {
    return availableUsers.find(p => p.id === userId);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const unassignedUsers = availableUsers.filter(p => !assignedTo.includes(p.id));

  const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  const isImageFile = (filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext || '');
  };

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
      
      // Load thumbnail URLs for image attachments
      const imageAttachments = data.filter(att => isImageFile(att.filename));
      
      if (imageAttachments.length > 0) {
        const urlPromises = imageAttachments.map(async (img) => {
          try {
            const signedUrl = await KanbanService.getSignedDownloadUrl(img.file_url, (img as any).storage_path);
            return { id: img.id, url: signedUrl };
          } catch (error) {
            console.error('Error getting thumbnail URL:', error);
            return { id: img.id, url: '' };
          }
        });
        
        const results = await Promise.all(urlPromises);
        const urls: Record<string, string> = {};
        results.forEach(r => {
          if (r.url) urls[r.id] = r.url;
        });
        setThumbnailUrls(urls);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const fileArray = Array.from(files);

    for (const file of fileArray) {
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
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFilePickerOpen(false);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file picker cancel (window regains focus without file selection)
  useEffect(() => {
    const handleWindowFocus = () => {
      // Small delay to allow file input change event to fire first
      setTimeout(() => {
        setIsFilePickerOpen(false);
      }, 100);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  const handleAttachmentClick = () => {
    setIsFilePickerOpen(true);
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleOpenAttachment = async (attachment: KanbanAttachment) => {
    try {
      // The bucket is private, so we need to generate a signed URL
      const signedUrl = await KanbanService.getSignedDownloadUrl(attachment.file_url, attachment.storage_path);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        toast.error('Could not open attachment');
      }
    } catch (error) {
      console.error('Error opening attachment:', error);
      toast.error('Failed to open attachment');
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

  const handleDownloadAttachment = async (attachment: KanbanAttachment) => {
    try {
      // Get signed URL for private bucket
      const signedUrl = await KanbanService.getSignedDownloadUrl(attachment.file_url, attachment.storage_path);
      
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download concluído');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast.error('Falha ao descarregar ficheiro');
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = useCallback(async () => {
    // Check if card should be moved
    if (moveToListId !== card.list_id && onMove) {
      try {
        // First update the card details
        await KanbanService.updateCard(card.id, {
          title,
          description,
          priority,
          value,
          due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
          tasks: tasks as any,
          tags: tags as any,
          assigned_to: assignedTo as any
        });
        
        // Then move it to the new list
        await onMove(card.id, moveToListId, moveToBoardId);
        toast.success('Card moved successfully');
      } catch (error) {
        console.error('Error moving card:', error);
        toast.error('Failed to move card');
      }
    } else {
      // Just update the card
      onUpdate(card.id, {
        title,
        description,
        priority,
        value,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
        tasks: tasks as any,
        tags: tags as any,
        assigned_to: assignedTo as any
      });
    }
    onClose();
  }, [card.id, card.list_id, title, description, priority, value, dueDate, tasks, tags, assignedTo, moveToListId, moveToBoardId, onMove, onUpdate, onClose]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleSave]);

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

  // Handle AI-generated tasks - add to card's checklist
  const handleAiTasksCreated = (newTasks: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' }>) => {
    const newChecklistTasks: Task[] = newTasks.map(task => ({
      id: crypto.randomUUID(),
      text: task.title,
      completed: false
    }));

    const updatedTasks = [...tasks, ...newChecklistTasks];
    setTasks(updatedTasks);
    onUpdate(card.id, { tasks: updatedTasks as any });
    toast.success(`${newTasks.length} tarefa${newTasks.length !== 1 ? 's' : ''} adicionada${newTasks.length !== 1 ? 's' : ''}!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing during file picker or upload
      if (!open && (isFilePickerOpen || isUploading)) return;
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold border-none p-0 focus-visible:ring-0"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Description</Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAiCardDialog(true)}
                className="h-7 w-7"
                title="Gerar Cards com AI"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              rows={4}
            />
          </div>

          <div>
            <Label>Valor (€)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={value || ''}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-8"
              />
            </div>
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
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assignado
            </Label>
            <div className="space-y-2 mt-1">
              {assignedTo.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignedTo.map((userId) => {
                    const user = getUserById(userId);
                    return (
                      <Badge key={userId} variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] bg-primary/10">{getInitials(user?.name || null)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{user?.name || 'Desconhecido'}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignee(userId)}
                          className="ml-0.5 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <div className="relative" ref={assignDropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                  disabled={unassignedUsers.length === 0}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Adicionar Utilizador
                </Button>
                {showAssignDropdown && unassignedUsers.length > 0 && (
                  <div className="absolute z-50 mt-1 w-64 bg-popover border rounded-md shadow-md py-1 max-h-48 overflow-y-auto">
                    {unassignedUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                        onClick={() => handleAddAssignee(user.id)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          {user.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="space-y-2">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <TaskChecklist 
              tasks={tasks} 
              onTasksChange={setTasks} 
              onAiGenerate={() => setShowAiDialog(true)}
              onConvertToCard={async (task) => {
                try {
                  // Create a new card with the task text as title
                  await KanbanService.createCard({
                    title: task.text,
                    list_id: card.list_id,
                    position: 0, // Will be placed at top
                    priority: 'medium',
                    due_date: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : undefined
                  });
                  
                  // Remove task from current card's checklist
                  const updatedTasks = tasks.filter(t => t.id !== task.id);
                  setTasks(updatedTasks);
                  onUpdate(card.id, { tasks: updatedTasks as any });
                  
                  toast.success('Tarefa convertida para novo card!');
                } catch (error) {
                  console.error('Error converting task to card:', error);
                  toast.error('Falha ao converter tarefa para card');
                }
              }}
            />
          </div>

          <div>
            <Collapsible open={showMoveSection} onOpenChange={setShowMoveSection}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <MoveRight className="h-4 w-4 mr-2" />
                  Move to another list/board
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <BoardListSelector
                  currentBoardId={boardId}
                  currentListId={card.list_id}
                  onBoardChange={setMoveToBoardId}
                  onListChange={setMoveToListId}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Attachments</Label>
              {attachments.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAiAttachmentDialog(true)}
                  className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                  title="Analisar anexo com AI"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div 
              className={`space-y-2 rounded-lg border-2 border-dashed p-3 transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-transparent'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {attachments.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
                    >
                      <button
                        onClick={() => handleOpenAttachment(attachment)}
                        className="flex items-center gap-2 flex-1 min-w-0 hover:underline text-left"
                      >
                        {thumbnailUrls[attachment.id] ? (
                          <img 
                            src={thumbnailUrls[attachment.id]} 
                            alt={attachment.filename}
                            className="w-10 h-10 object-cover rounded border flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span 
                          className="text-lg" 
                          style={{ display: thumbnailUrls[attachment.id] ? 'none' : 'inline' }}
                        >
                          {getFileIcon(attachment.filename)}
                        </span>
                        <span className="text-sm truncate max-w-[300px]">{attachment.filename}</span>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(attachment)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {isDragging && (
                <div className="flex items-center justify-center py-8 text-primary">
                  <Upload className="h-8 w-8 mr-2" />
                  <span className="text-lg font-medium">Drop files here</span>
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
                onClick={handleAttachmentClick}
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

      <AiTaskGeneratorDialog
        isOpen={showAiDialog}
        onClose={() => setShowAiDialog(false)}
        onTasksCreated={handleAiTasksCreated}
      />

      <AiCardGeneratorDialog
        isOpen={showAiCardDialog}
        onClose={() => setShowAiCardDialog(false)}
        onCardsCreated={async (newCards) => {
          try {
            for (const cardData of newCards) {
              await KanbanService.createCard({
                title: cardData.title,
                description: cardData.description,
                list_id: card.list_id,
                position: 0,
                priority: cardData.priority,
              });
            }
            toast.success(`${newCards.length} card${newCards.length !== 1 ? 's' : ''} criado${newCards.length !== 1 ? 's' : ''}!`);
          } catch (error) {
            console.error('Error creating cards:', error);
            toast.error('Falha ao criar cards');
          }
        }}
      />

      <AiAttachmentAnalyzerDialog
        isOpen={showAiAttachmentDialog}
        onClose={() => setShowAiAttachmentDialog(false)}
        attachments={attachments}
        cardId={card.id}
        onDataExtracted={(data) => {
          // Apply extracted data to card fields
          if (data.description) {
            setDescription(data.description);
          } else if (data.summary) {
            setDescription(data.summary);
          }
          
          if (data.value !== undefined && data.value > 0) {
            setValue(data.value);
          }
          
          if (data.due_date) {
            // Parse date in YYYY-MM-DD format
            const parsedDate = new Date(data.due_date);
            if (!isNaN(parsedDate.getTime())) {
              setDueDate(parsedDate);
            }
          }
          
          if (data.priority) {
            setPriority(data.priority);
          }
          
          if (data.suggested_tags && data.suggested_tags.length > 0) {
            // Merge with existing tags (avoid duplicates)
            const newTags = data.suggested_tags.filter(t => !tags.includes(t));
            if (newTags.length > 0) {
              setTags([...tags, ...newTags]);
            }
          }
          
          if (data.suggested_tasks && data.suggested_tasks.length > 0) {
            // Add new tasks to checklist
            const newTasks = data.suggested_tasks.map(taskText => ({
              id: crypto.randomUUID(),
              text: taskText,
              completed: false
            }));
            setTasks([...tasks, ...newTasks]);
          }
        }}
      />
    </Dialog>
  );
};
