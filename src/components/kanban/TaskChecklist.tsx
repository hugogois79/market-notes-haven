import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskChecklistProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export const TaskChecklist: React.FC<TaskChecklistProps> = ({ tasks, onTasksChange }) => {
  const [newTaskText, setNewTaskText] = useState('');

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
            />
            <span
              className={`flex-1 text-sm ${
                task.completed ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {task.text}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeTask(task.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
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
      </div>
    </div>
  );
};
