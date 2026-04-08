import React, { useState, useMemo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import { KanbanCard as KanbanCardType } from '@/services/kanbanService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, AlertCircle, CheckCircle2, RotateCcw, Paperclip, ListChecks, Tag, Euro, Trash2, ShoppingCart, ExternalLink, Shield } from 'lucide-react';
import { format, isPast, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface KanbanCardProps {
  card: KanbanCardType;
  index: number;
  onClick: () => void;
  onMarkComplete: (cardId: string) => void;
  onChangePriority: (cardId: string, priority: 'low' | 'medium' | 'high') => void;
  onToggleProcurement: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 hover:bg-green-200',
  medium: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  high: 'bg-red-100 text-red-800 hover:bg-red-200'
};

const avatarColors = [
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-violet-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-cyan-500 text-white',
];

const externalAvatarStyles = [
  { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-400' },
  { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-400' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-400' },
  { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-400' },
  { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-400' },
  { bg: 'bg-lime-100 dark:bg-lime-900/40', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-400' },
  { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-400' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-400' },
];

const stringHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getAvatarColor = (userId: string) => {
  return avatarColors[stringHash(userId) % avatarColors.length];
};

const getExternalStyle = (name: string) => {
  return externalAvatarStyles[stringHash(name) % externalAvatarStyles.length];
};

const getInitials = (name: string | null) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, index, onClick, onMarkComplete, onChangePriority, onToggleProcurement, onDeleteCard }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Cached query for expense users (shared across all cards)
  const { data: expenseUsers = [] } = useQuery({
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
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const assignedUsers = ((card as any).assigned_to || []) as string[];
  const assignedExternal = ((card as any).assigned_external || []) as string[];
  const supervisorId = (card as any).supervisor_id as string | null;

  // Check if card is marked for procurement
  const isProcurement = card.tags?.includes('_procurement') ?? false;

  // Calculate if card is overdue
  const isOverdue = card.due_date && !card.concluded ? (() => {
    const dueDate = new Date(card.due_date);
    return isPast(startOfDay(dueDate)) && startOfDay(dueDate).getTime() !== startOfDay(new Date()).getTime();
  })() : false;

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkComplete(card.id);
  };

  const handleReopen = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkComplete(card.id);
    toast.success('Card reopened');
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Card
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`mb-2 cursor-pointer hover:shadow-md transition-shadow relative ${
                snapshot.isDragging ? 'shadow-lg rotate-2' : ''
              } ${isProcurement ? 'bg-purple-50 border-purple-400 dark:bg-purple-950/30 dark:border-purple-700' : isOverdue ? 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800' : ''}`}
              onClick={onClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isHovered && !card.concluded && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background border-2 border-orange-500 shadow-lg hover:bg-orange-500 hover:text-white z-10 p-0"
                  onClick={handleReopen}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-2">{card.title}</h4>
                
                {card.description && (
                  <div
                    className="text-xs text-muted-foreground line-clamp-2 mb-2 prose prose-sm dark:prose-invert max-w-none [&>*]:m-0 [&>*]:text-xs"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(card.description),
                    }}
                  />
                )}
                
                <div className="flex items-center gap-2 flex-wrap">
                  {card.priority && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${priorityColors[card.priority]}`}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {card.priority}
                    </Badge>
                  )}
                  
                  {card.due_date && (() => {
                    const dueDate = new Date(card.due_date);
                    const isOverdue = isPast(startOfDay(dueDate)) && startOfDay(dueDate).getTime() !== startOfDay(new Date()).getTime();
                    return (
                      <Badge variant="outline" className={`text-xs ${isOverdue ? 'border-red-500' : ''}`}>
                        <Calendar className={`h-3 w-3 mr-1 ${isOverdue ? 'text-red-500' : ''}`} />
                        {isOverdue && '! '}
                        {format(dueDate, 'MMM dd')}
                      </Badge>
                    );
                  })()}
                  
                  {card.tasks && Array.isArray(card.tasks) && card.tasks.length > 0 && (() => {
                    const completed = card.tasks.filter((t: any) => t.completed).length;
                    const total = card.tasks.length;
                    return (
                      <Badge variant="outline" className="text-xs">
                        <ListChecks className="h-3 w-3 mr-1" />
                        {completed}/{total}
                      </Badge>
                    );
                  })()}
                  
                  {card.attachment_count && card.attachment_count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Paperclip className="h-3 w-3 mr-1" />
                      {card.attachment_count}
                    </Badge>
                  )}
                  
                  {card.value && card.value > 0 && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                      <Euro className="h-3 w-3 mr-1" />
                      {card.value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Badge>
                  )}
                  
                  {card.tags && card.tags.length > 0 && card.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {(assignedUsers.length > 0 || assignedExternal.length > 0 || supervisorId) && (
                  <div className="flex items-center justify-end gap-0 mt-2 -space-x-1.5">
                    {supervisorId && (() => {
                      const sv = expenseUsers.find(u => u.id === supervisorId);
                      const svName = sv?.name || 'Supervisor';
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Avatar className="h-6 w-6 border-2 border-blue-400 cursor-default bg-blue-500 text-white">
                                <AvatarFallback className="text-[9px] font-semibold bg-blue-500 text-white">
                                  {getInitials(svName)}
                                </AvatarFallback>
                              </Avatar>
                              <Shield className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-blue-600 bg-white dark:bg-gray-900 rounded-full" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {svName}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                    {assignedUsers.map((userId) => {
                      const user = expenseUsers.find(u => u.id === userId);
                      const name = user?.name || 'Desconhecido';
                      return (
                        <Tooltip key={userId}>
                          <TooltipTrigger asChild>
                            <Avatar className={`h-6 w-6 border-2 border-background cursor-default ${getAvatarColor(userId)}`}>
                              <AvatarFallback className={`text-[9px] font-semibold ${getAvatarColor(userId)}`}>
                                {getInitials(name)}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            {name}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {assignedExternal.map((name) => {
                      const extStyle = getExternalStyle(name);
                      return (
                      <Tooltip key={`ext-${name}`}>
                        <TooltipTrigger asChild>
                          <Avatar className={`h-6 w-6 border-2 border-dashed cursor-default ${extStyle.border} ${extStyle.bg}`}>
                            <AvatarFallback className={`text-[9px] font-semibold ${extStyle.text} ${extStyle.bg}`}>
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <span className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {name}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem 
              onClick={() => onChangePriority(card.id, 'high')}
              className="text-red-600"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Alta prioridade
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => onChangePriority(card.id, 'medium')}
              className="text-orange-600"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Média prioridade
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => onChangePriority(card.id, 'low')}
              className="text-green-600"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Baixa prioridade
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onToggleProcurement(card.id)}
              className="text-purple-600"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isProcurement ? 'Remover Procurement' : 'Pedir Orçamentos'}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDeleteCard(card.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar card
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}
    </Draggable>
  );
};
