import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Pencil, Check, Calendar as CalendarIcon, Sparkles, ArrowUpRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: Date;
}

interface TaskChecklistProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onAiGenerate?: () => void;
  onConvertToCard?: (task: Task) => void;
}

export const TaskChecklist: React.FC<TaskChecklistProps> = ({ tasks, onTasksChange, onAiGenerate, onConvertToCard }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDate, setEditingDate] = useState<Date | undefined>(undefined);

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: crypto.randomUUID(),
        text: newTaskText.trim(),
        completed: false
      };
      onTasksChange([...tasks, newTask]);
      setNewTaskText('');
    }
  };

  const toggleTask = (taskId: string) => {
    onTasksChange(
      tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const removeTask = (taskId: string) => {
    onTasksChange(tasks.filter(task => task.id !== taskId));
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
    setEditingDate(task.dueDate);
  };

  const saveEdit = (taskId: string) => {
    if (editingText.trim()) {
      onTasksChange(
        tasks.map(task =>
          task.id === taskId ? { ...task, text: editingText.trim(), dueDate: editingDate } : task
        )
      );
    }
    setEditingTaskId(null);
    setEditingText('');
    setEditingDate(undefined);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingText('');
    setEditingDate(undefined);
  };

  const updateTaskDate = (taskId: string, date: Date | undefined) => {
    onTasksChange(
      tasks.map(task =>
        task.id === taskId ? { ...task, dueDate: date } : task
      )
    );
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Tasks</Label>
        {tasks.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {completedCount}/{tasks.length} completed
          </span>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="w-full bg-secondary rounded-full h-2 mb-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-2 group p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
              disabled={editingTaskId === task.id}
            />
            {editingTaskId === task.id ? (
              <>
                <div className="flex-1 flex flex-col gap-2">
                  <Input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveEdit(task.id);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEdit();
                      }
                    }}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal h-7",
                          !editingDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {editingDate ? format(editingDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editingDate}
                        onSelect={setEditingDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveEdit(task.id)}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 flex flex-col gap-1">
                  <span
                    className={`text-sm ${
                      task.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {task.text}
                  </span>
                  {task.dueDate && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-fit h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {format(new Date(task.dueDate), "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={task.dueDate ? new Date(task.dueDate) : undefined}
                          onSelect={(date) => updateTaskDate(task.id, date)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                {onConvertToCard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConvertToCard(task)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    title="Converter para Card"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(task)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a task..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTask();
            }
          }}
        />
        <Button variant="outline" size="icon" onClick={addTask}>
          <Plus className="h-4 w-4" />
        </Button>
        {onAiGenerate && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onAiGenerate}
            title="Gerar tarefas com AI"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
