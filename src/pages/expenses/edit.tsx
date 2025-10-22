import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { expenseClaimService, Expense } from "@/services/expenseClaimService";
import { expenseRequesterService } from "@/services/expenseRequesterService";
import { supplierService } from "@/services/supplierService";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

interface ExpenseFormData {
  expense_date: string;
  description: string;
  supplier: string;
  amount: string;
  project_id: string;
  receipt_file?: File;
}

const EditExpensePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [claimType, setClaimType] = useState<"reembolso" | "justificacao_cartao">("reembolso");
  const [description, setDescription] = useState("");
  const [requesterId, setRequesterId] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    expense_date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    supplier: "",
    amount: "",
    project_id: "",
  });

  const [supplierOpen, setSupplierOpen] = useState(false);

  // Load existing claim
  const { data: claim, isLoading } = useQuery({
    queryKey: ["expense-claim", id],
    queryFn: () => expenseClaimService.getExpenseClaimById(id!),
    enabled: !!id,
  });

  // Load expenses for this claim
  const { data: existingExpenses } = useQuery({
    queryKey: ["expenses", id],
    queryFn: () => expenseClaimService.getExpenses(id!),
    enabled: !!id,
  });

  // Load claim data when available
  useEffect(() => {
    if (claim) {
      setClaimType(claim.claim_type as "reembolso" | "justificacao_cartao");
      setDescription(claim.description || "");
      setRequesterId(claim.requester_id || "");
    }
  }, [claim]);

  // Load expenses when available
  useEffect(() => {
    if (existingExpenses) {
      setExpenses(existingExpenses);
    }
  }, [existingExpenses]);

  // Get requesters for dropdown
  const { data: requesters } = useQuery({
    queryKey: ["expense-requesters"],
    queryFn: () => expenseRequesterService.getRequesters(),
  });

  // Get projects for dropdown - filtered by requester
  const { data: projects } = useQuery({
    queryKey: ["financial-projects", requesterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_projects")
        .select("id, name")
        .eq("status", "active");
      if (error) throw error;
      
      // Filter by requester's assigned projects
      if (requesterId && requesters) {
        const selectedRequester = requesters.find(r => r.id === requesterId);
        if (selectedRequester?.assigned_project_ids?.length) {
          return data?.filter(p => selectedRequester.assigned_project_ids.includes(p.id)) || [];
        }
      }
      
      return data || [];
    },
    enabled: !!requesters,
  });

  // Get suppliers for autocomplete
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierService.getSuppliers(),
  });

  const updateClaimMutation = useMutation({
    mutationFn: (updates: any) => expenseClaimService.updateExpenseClaim(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claim", id] });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: expenseClaimService.addExpense,
    onSuccess: (data) => {
      setExpenses([...expenses, data]);
      setShowExpenseDialog(false);
      resetExpenseForm();
      toast({
        title: "Despesa adicionada",
        description: "A despesa foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error adding expense:", error);
      toast({
        title: "Erro ao adicionar despesa",
        description: "Não foi possível adicionar a despesa. Por favor tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Expense> }) =>
      expenseClaimService.updateExpense(id, updates),
    onSuccess: (updatedExpense) => {
      setExpenses(expenses.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));
      setShowExpenseDialog(false);
      setEditingExpense(null);
      resetExpenseForm();
      toast({
        title: "Despesa atualizada",
        description: "A despesa foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error updating expense:", error);
      toast({
        title: "Erro ao atualizar despesa",
        description: "Não foi possível atualizar a despesa. Por favor tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: ({ id, claimId }: { id: string; claimId: string }) =>
      expenseClaimService.deleteExpense(id, claimId),
    onSuccess: (_, variables) => {
      setExpenses(expenses.filter((e) => e.id !== variables.id));
      toast({
        title: "Despesa removida",
        description: "A despesa foi removida com sucesso.",
      });
    },
  });

  const submitClaimMutation = useMutation({
    mutationFn: expenseClaimService.submitExpenseClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      toast({
        title: "Requisição submetida",
        description: "Sua requisição foi submetida com sucesso.",
      });
      navigate("/expenses");
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      expenseClaimService.updateExpenseClaim(id!, {
        description,
        requester_id: requesterId || null,
        status: "rascunho",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      toast({
        title: "Rascunho salvo",
        description: "Sua requisição foi salva como rascunho.",
      });
      navigate("/expenses");
    },
  });

  const deleteClaimMutation = useMutation({
    mutationFn: () => expenseClaimService.deleteExpenseClaim(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      toast({
        title: "Rascunho eliminado",
        description: "O rascunho foi eliminado com sucesso.",
      });
      navigate("/expenses");
    },
  });

  const resetExpenseForm = () => {
    setExpenseForm({
      expense_date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      supplier: "",
      amount: "",
      project_id: "",
    });
  };

  const handleAddExpense = async () => {
    try {
      // Validação básica
      if (!expenseForm.expense_date || !expenseForm.description || !expenseForm.supplier || !expenseForm.amount) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      if (parseFloat(expenseForm.amount) <= 0) {
        toast({
          title: "Valor inválido",
          description: "O valor da despesa deve ser maior que zero.",
          variant: "destructive",
        });
        return;
      }

      // Create or get supplier
      if (expenseForm.supplier.trim()) {
        await supplierService.getOrCreateSupplier(expenseForm.supplier.trim());
        queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      }

      let receiptUrl = null;
      if (expenseForm.receipt_file && id) {
        try {
          receiptUrl = await expenseClaimService.uploadReceipt(
            expenseForm.receipt_file,
            id
          );
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Erro no upload",
            description: "Não foi possível fazer upload do comprovativo. A despesa será guardada sem comprovativo.",
            variant: "destructive",
          });
        }
      }

      if (editingExpense) {
        updateExpenseMutation.mutate({
          id: editingExpense.id,
          updates: {
            expense_date: expenseForm.expense_date,
            description: expenseForm.description,
            supplier: expenseForm.supplier.trim(),
            amount: parseFloat(expenseForm.amount),
            project_id: expenseForm.project_id || null,
            receipt_image_url: receiptUrl || editingExpense.receipt_image_url,
          },
        });
      } else {
        addExpenseMutation.mutate({
          expense_claim_id: id!,
          expense_date: expenseForm.expense_date,
          description: expenseForm.description,
          supplier: expenseForm.supplier.trim(),
          amount: parseFloat(expenseForm.amount),
          project_id: expenseForm.project_id || null,
          receipt_image_url: receiptUrl,
        });
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao guardar a despesa. Por favor tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      expense_date: expense.expense_date,
      description: expense.description,
      supplier: expense.supplier,
      amount: expense.amount.toString(),
      project_id: expense.project_id || "",
    });
    setShowExpenseDialog(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (id) {
      deleteExpenseMutation.mutate({ id: expenseId, claimId: id });
    }
  };

  const handleSubmit = () => {
    if (!id) {
      toast({
        title: "Erro",
        description: "ID da requisição não encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (expenses.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma despesa antes de submeter.",
        variant: "destructive",
      });
      return;
    }

    submitClaimMutation.mutate(id);
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate();
  };

  const handleDeleteDraft = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteDraft = () => {
    deleteClaimMutation.mutate();
  };

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  if (isLoading) {
    return <div className="container mx-auto p-8">Carregando...</div>;
  }

  if (!claim) {
    return <div className="container mx-auto p-8">Requisição não encontrada.</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/expenses")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Requisição de Despesas</h1>
          <p className="text-muted-foreground">Edite os dados da requisição #{claim.claim_number}</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tipo de Requisição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="requester">Requisitante *</Label>
            <Select value={requesterId} onValueChange={setRequesterId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o requisitante" />
              </SelectTrigger>
              <SelectContent>
                {requesters?.map((requester) => (
                  <SelectItem key={requester.id} value={requester.id}>
                    {requester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <RadioGroup value={claimType} onValueChange={(value: any) => setClaimType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="reembolso" id="reembolso" />
              <Label htmlFor="reembolso">Reembolso de Despesas</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="justificacao_cartao" id="justificacao" />
              <Label htmlFor="justificacao">Justificação de Cartão</Label>
            </div>
          </RadioGroup>

          <div>
            <Label htmlFor="description">Descrição Geral</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ex: Viagem a Lisboa para reunião com cliente"
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Despesas</CardTitle>
            <Button onClick={() => setShowExpenseDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma despesa adicionada. Clique em "Adicionar Despesa" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.expense_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.supplier}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(expense.amount))}
                    </TableCell>
                    <TableCell>
                      {projects?.find((p) => p.id === expense.project_id)?.name ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo e Submissão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending}
              >
                Guardar Rascunho
              </Button>
              {claim?.status === "rascunho" && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteDraft}
                  disabled={deleteClaimMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Rascunho
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitClaimMutation.isPending || expenses.length === 0}
              >
                Submeter Requisição
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Editar Despesa" : "Adicionar Despesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expense_date">Data *</Label>
              <Input
                id="expense_date"
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, expense_date: e.target.value })
                }
                max={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div>
              <Label htmlFor="expense_description">Descrição *</Label>
              <Input
                id="expense_description"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                }
                placeholder="Descrição da despesa"
              />
            </div>
            <div>
              <Label htmlFor="supplier">Fornecedor *</Label>
              <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={supplierOpen}
                    className="w-full justify-between"
                  >
                    {expenseForm.supplier || "Selecione ou digite um fornecedor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && expenseForm.supplier.trim()) {
                        e.preventDefault();
                        setSupplierOpen(false);
                      }
                    }}
                  >
                    <CommandInput 
                      placeholder="Procurar ou adicionar fornecedor..." 
                      value={expenseForm.supplier}
                      onValueChange={(value) =>
                        setExpenseForm({ ...expenseForm, supplier: value })
                      }
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm">
                          Pressione Enter para adicionar "{expenseForm.supplier}"
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {suppliers?.map((supplier) => (
                          <CommandItem
                            key={supplier.id}
                            value={supplier.name}
                            onSelect={(currentValue) => {
                              setExpenseForm({ ...expenseForm, supplier: currentValue });
                              setSupplierOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                expenseForm.supplier === supplier.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {supplier.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="amount">Valor (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="project">Projeto (opcional)</Label>
              <Select
                value={expenseForm.project_id || "none"}
                onValueChange={(value) =>
                  setExpenseForm({ ...expenseForm, project_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="receipt">Comprovativo (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="receipt"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setExpenseForm({ ...expenseForm, receipt_file: file });
                    }
                  }}
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Formatos aceites: JPG, PNG, PDF (máx. 5MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddExpense}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. O rascunho e todas as despesas associadas serão permanentemente eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDraft} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditExpensePage;
