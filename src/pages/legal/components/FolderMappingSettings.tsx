import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, Trash2, Pencil, Folder, Link2, HardDrive, ExternalLink, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LegalCase {
  id: string;
  title: string;
}

interface CaseFolder {
  id: string;
  case_id: string;
  folder_path: string;
  label: string | null;
  created_at: string;
}

interface ServerFolder {
  name: string;
  type: string;
}

const DRIVE_URL = "https://drive.robsonway.com";

export function FolderMappingSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCase, setFilterCase] = useState<string>("all");
  const [form, setForm] = useState({
    case_id: "",
    folder_path: "",
    label: "",
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["legal-cases-list"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("legal_cases")
        .select("id, title")
        .eq("user_id", user.id)
        .order("title");
      if (error) throw error;
      return data as LegalCase[];
    },
  });

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["legal-case-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_case_folders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CaseFolder[];
    },
  });

  const { data: serverFolders = [] } = useQuery({
    queryKey: ["legal-server-folders"],
    queryFn: async () => {
      const res = await fetch("/api/legal-files/list?folder=");
      if (!res.ok) throw new Error("Failed to list folders");
      const data = await res.json();
      return (data.items || []).filter((i: ServerFolder) => i.type === "dir") as ServerFolder[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (mapping: { case_id: string; folder_path: string; label: string | null }) => {
      const { data, error } = await supabase
        .from("legal_case_folders")
        .insert(mapping)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-case-folders"] });
      toast.success("Mapeamento adicionado");
      closeDialog();
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Este caso já está mapeado para esta pasta");
      } else {
        toast.error("Erro ao adicionar mapeamento");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...mapping }: { id: string; case_id: string; folder_path: string; label: string | null }) => {
      const { data, error } = await supabase
        .from("legal_case_folders")
        .update(mapping)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-case-folders"] });
      toast.success("Mapeamento atualizado");
      closeDialog();
    },
    onError: () => toast.error("Erro ao atualizar mapeamento"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("legal_case_folders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-case-folders"] });
      toast.success("Mapeamento removido");
    },
    onError: () => toast.error("Erro ao remover mapeamento"),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ case_id: "", folder_path: "", label: "" });
  };

  const openEdit = (mapping: CaseFolder) => {
    setEditingId(mapping.id);
    setForm({
      case_id: mapping.case_id,
      folder_path: mapping.folder_path,
      label: mapping.label || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.case_id || !form.folder_path) {
      toast.error("Selecione um caso e uma pasta");
      return;
    }
    const payload = {
      case_id: form.case_id,
      folder_path: form.folder_path,
      label: form.label || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getCaseName = (caseId: string) =>
    cases.find((c) => c.id === caseId)?.title || "—";

  const filteredMappings = filterCase === "all"
    ? mappings
    : mappings.filter((m) => m.case_id === filterCase);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Folder Mapping
        </h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Mapear casos jurídicos para pastas de ficheiros no servidor (
        <a href={DRIVE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">
          drive.robsonway.com <ExternalLink className="h-3 w-3" />
        </a>
        ).
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-slate-500">Filtrar por caso:</Label>
          <Select value={filterCase} onValueChange={setFilterCase}>
            <SelectTrigger className="w-[250px] h-8 text-sm">
              <SelectValue placeholder="Todos os casos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os casos</SelectItem>
              {cases.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
      ) : filteredMappings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
          Nenhum mapeamento configurado. Clique em "Adicionar" para mapear um caso a uma pasta.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caso</TableHead>
                <TableHead>Pasta no Servidor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">{getCaseName(mapping.case_id)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <a
                        href={`${DRIVE_URL}/${encodeURIComponent(mapping.folder_path)}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {mapping.folder_path}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    {mapping.label ? (
                      <Badge variant="outline" className="text-xs">{mapping.label}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(mapping)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(mapping.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1">
        <HardDrive className="h-3 w-3" />
        {serverFolders.length} pastas disponíveis no servidor
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Mapeamento" : "Novo Mapeamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Caso</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {form.case_id ? (
                      <span className="truncate">{cases.find((c) => c.id === form.case_id)?.title}</span>
                    ) : (
                      <span className="text-muted-foreground">Procurar caso...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar caso..." />
                    <CommandList>
                      <CommandEmpty>Nenhum caso encontrado.</CommandEmpty>
                      <CommandGroup>
                        {cases.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.title}
                            onSelect={() => setForm({ ...form, case_id: c.id })}
                          >
                            {c.title}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                form.case_id === c.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Pasta no Servidor</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {form.folder_path ? (
                      <span className="flex items-center gap-2 truncate">
                        <Folder className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        {form.folder_path}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Procurar pasta...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar pasta..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma pasta encontrada.</CommandEmpty>
                      <CommandGroup>
                        {serverFolders.map((f) => (
                          <CommandItem
                            key={f.name}
                            value={f.name}
                            onSelect={() => setForm({ ...form, folder_path: f.name })}
                          >
                            <Folder className="mr-2 h-3.5 w-3.5 text-amber-500" />
                            {f.name}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                form.folder_path === f.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ex: Advogado principal, Tribunal..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Guardar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
