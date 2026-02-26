import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanService, KanbanComment } from '@/services/kanbanService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Pencil, Trash2, X, Check, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface CardCommentsSectionProps {
  cardId: string;
}

export default function CardCommentsSection({ cardId }: CardCommentsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['kanban-comments', cardId],
    queryFn: () => KanbanService.getComments(cardId),
    enabled: !!cardId,
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['expense-users-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_users')
        .select('id, name, email, auth_user_id');
      if (error) throw error;
      return data || [];
    },
  });

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Anónimo';
    const profile = userProfiles.find(p => p.auth_user_id === userId);
    return profile?.name || 'Utilizador';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const addMutation = useMutation({
    mutationFn: (content: string) => KanbanService.addComment(cardId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-comments', cardId] });
      setNewComment('');
      toast.success('Comentário adicionado');
    },
    onError: () => toast.error('Erro ao adicionar comentário'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      KanbanService.updateComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-comments', cardId] });
      setEditingId(null);
      setEditContent('');
      toast.success('Comentário atualizado');
    },
    onError: () => toast.error('Erro ao atualizar comentário'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => KanbanService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-comments', cardId] });
      toast.success('Comentário eliminado');
    },
    onError: () => toast.error('Erro ao eliminar comentário'),
  });

  const handleSubmit = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
  };

  const handleStartEdit = (comment: KanbanComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    updateMutation.mutate({ id: editingId, content: editContent.trim() });
  };

  const handleDelete = (id: string) => {
    if (confirm('Eliminar este comentário?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const distance = formatDistanceToNow(date, { addSuffix: true, locale: pt });
    return distance;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Comentários
          {comments.length > 0 && (
            <span className="text-muted-foreground ml-1">({comments.length})</span>
          )}
        </span>
      </div>

      {/* New comment input */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escrever um comentário..."
          className="min-h-[60px] text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!newComment.trim() || addMutation.isPending}
          className="shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground -mt-2">Ctrl+Enter para enviar</p>

      {/* Comments list */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground">A carregar...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Sem comentários. Seja o primeiro a comentar.</p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {comments.map((comment) => {
            const isOwner = user?.id === comment.user_id;
            const authorName = getUserName(comment.user_id);
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className="flex gap-2 group">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarFallback className="text-[10px] bg-primary/10">
                    {getInitials(authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{authorName}</span>
                    <span className="text-[10px] text-muted-foreground" title={comment.created_at ? format(new Date(comment.created_at), 'PPpp', { locale: pt }) : ''}>
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  {isEditing ? (
                    <div className="mt-1 space-y-1">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[50px] text-sm resize-none"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={handleSaveEdit}>
                          <Check className="h-3 w-3 mr-1" /> Guardar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3 mr-1" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-0.5">{comment.content}</p>
                  )}
                </div>
                {isOwner && !isEditing && (
                  <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEdit(comment)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(comment.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
