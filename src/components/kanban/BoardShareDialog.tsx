import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KanbanBoard, KanbanService } from "@/services/kanbanService";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Users } from "lucide-react";
import { toast } from "sonner";

interface BoardShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: KanbanBoard;
  onUpdated: () => void;
}

export default function BoardShareDialog({ open, onOpenChange, board, onUpdated }: BoardShareDialogProps) {
  const { user } = useAuth();
  const [isShared, setIsShared] = useState(board.is_shared);
  const [allowedIds, setAllowedIds] = useState<string[]>(board.allowed_user_ids || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setIsShared(board.is_shared);
      setAllowedIds(board.allowed_user_ids || []);
    }
  }, [open, board]);

  const { data: users = [] } = useQuery({
    queryKey: ["all-auth-users-for-sharing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_users")
        .select("id, name, email, auth_user_id: user_id")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const otherUsers = users.filter(u => u.auth_user_id !== user?.id);

  const toggleUser = (authUserId: string) => {
    setAllowedIds(prev =>
      prev.includes(authUserId)
        ? prev.filter(id => id !== authUserId)
        : [...prev, authUserId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await KanbanService.updateBoardAccess(board.id, allowedIds, isShared);
      toast.success("Permissões atualizadas");
      onUpdated();
      onOpenChange(false);
    } catch (e) {
      toast.error("Erro ao guardar permissões");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const accessMode = isShared ? "public" : allowedIds.length > 0 ? "specific" : "private";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Partilhar Board: {board.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Access mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Modo de acesso</Label>
            
            <button
              onClick={() => { setIsShared(false); setAllowedIds([]); }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                accessMode === "private" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <Lock className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Privado</p>
                <p className="text-xs text-muted-foreground">Só eu posso ver este board</p>
              </div>
            </button>

            <button
              onClick={() => { setIsShared(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                accessMode === "specific" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Utilizadores específicos</p>
                <p className="text-xs text-muted-foreground">Partilhar com pessoas selecionadas</p>
              </div>
            </button>

            <button
              onClick={() => setIsShared(true)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                accessMode === "public" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <Globe className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Partilhado</p>
                <p className="text-xs text-muted-foreground">Todos os utilizadores com permissão boards</p>
              </div>
            </button>
          </div>

          {/* User list (when specific mode) */}
          {!isShared && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Utilizadores com acesso
                {allowedIds.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">{allowedIds.length}</Badge>
                )}
              </Label>
              <div className="max-h-[200px] overflow-y-auto space-y-1 border rounded-lg p-2">
                {otherUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Sem utilizadores disponíveis</p>
                ) : (
                  otherUsers.map(u => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={allowedIds.includes(u.auth_user_id)}
                        onCheckedChange={() => toggleUser(u.auth_user_id)}
                      />
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-primary/10">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        {u.email && <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "A guardar..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
