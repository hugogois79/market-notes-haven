import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Upload, FileText, Download } from "lucide-react";
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

import { supplierService } from "@/services/supplierService";
import { expenseUserService } from "@/services/expenseUserService";
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
  category_id: string;
  receipt_file?: File;
}

const NewExpensePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [claimType, setClaimType] = useState<"reembolso" | "justificacao_cartao">("reembolso");
  const [description, setDescription] = useState("");
  const [claimDate, setClaimDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [requesterId, setRequesterId] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentClaimId, setCurrentClaimId] = useState<string | null>(null);
  
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    expense_date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    supplier: "",
    amount: "",
    project_id: "",
    category_id: "",
  });

  // Get expense requesters (users marked as requesters) for dropdown
  const { data: expenseRequesters } = useQuery({
    queryKey: ["expense-requesters"],
    queryFn: () => expenseUserService.getRequesters(),
  });

  // Get the selected requester's assigned projects
  const selectedRequester = expenseRequesters?.find(r => r.id === requesterId);

  // Get projects for dropdown - filtered by selected requester's assigned projects
  const { data: projects } = useQuery({
    queryKey: ["expense-projects", selectedRequester?.assigned_project_ids],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      
      // Filter by selected requester's assigned projects
      if (selectedRequester?.assigned_project_ids?.length) {
        const filtered = data?.filter(p => selectedRequester.assigned_project_ids!.includes(p.id)) || [];
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      return data || [];
    },
    enabled: !!requesterId,
  });

  // Get suppliers for autocomplete
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierService.getSuppliers(),
  });

  // Get expense categories - filtered by selected project
  const { data: categories } = useQuery({
    queryKey: ["expense-categories", expenseForm.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("id, name, color, assigned_project_ids")
        .eq("is_active", true)
        .in("category_type", ["expense", "despesa", "ambos", "both"]);
      if (error) throw error;
      
      // Filter by selected project's assigned categories
      if (expenseForm.project_id && data) {
        return data.filter(cat => 
          !cat.assigned_project_ids?.length || 
          cat.assigned_project_ids.includes(expenseForm.project_id)
        );
      }
      
      return data || [];
    },
  });

  const [supplierOpen, setSupplierOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const createClaimMutation = useMutation({
    mutationFn: expenseClaimService.createExpenseClaim,
    onSuccess: (data) => {
      setCurrentClaimId(data.id);
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
    onSuccess: (data) => {
      setExpenses(expenses.map((e) => (e.id === data.id ? data : e)));
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
      expenseClaimService.updateExpenseClaim(currentClaimId!, {
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

  const resetExpenseForm = () => {
    setExpenseForm({
      expense_date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      supplier: "",
      amount: "",
      project_id: "",
      category_id: "",
      receipt_file: undefined,
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

      const parsedAmount = parseFloat(expenseForm.amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast({
          title: "Valor inválido",
          description: "O valor da despesa deve ser maior que zero.",
          variant: "destructive",
        });
        return;
      }

      // Validação do comprovativo (obrigatório apenas para novas despesas)
      if (!editingExpense && !expenseForm.receipt_file) {
        toast({
          title: "Comprovativo obrigatório",
          description: "Por favor anexe o comprovativo da despesa.",
          variant: "destructive",
        });
        return;
      }

      let claimId = currentClaimId;
      
      // Create claim if it doesn't exist
      if (!claimId) {
        const claim = await createClaimMutation.mutateAsync({
          claim_type: claimType,
          description,
          claim_date: claimDate,
          status: "rascunho",
          requester_id: requesterId && requesterId.trim() !== "" ? requesterId : null,
        });
        claimId = claim.id;
        setCurrentClaimId(claim.id);
      }

      // Create or get supplier
      if (expenseForm.supplier.trim()) {
        await supplierService.getOrCreateSupplier(expenseForm.supplier.trim());
        // Invalidate suppliers query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      }

      let receiptUrl = null;
      if (expenseForm.receipt_file && claimId) {
        try {
          receiptUrl = await expenseClaimService.uploadReceipt(
            expenseForm.receipt_file,
            claimId
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
            amount: parseFloat(expenseForm.amount.replace(',', '.')),
            project_id: expenseForm.project_id || null,
            category_id: expenseForm.category_id || null,
            receipt_image_url: receiptUrl || editingExpense.receipt_image_url,
          },
        });
      } else {
        addExpenseMutation.mutate({
          expense_claim_id: claimId,
          expense_date: expenseForm.expense_date,
          description: expenseForm.description,
          supplier: expenseForm.supplier.trim(),
          amount: parseFloat(expenseForm.amount.replace(',', '.')),
          project_id: expenseForm.project_id || null,
          category_id: expenseForm.category_id || null,
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
      category_id: expense.category_id || "",
    });
    setShowExpenseDialog(true);
  };

  const handleDeleteExpense = (id: string) => {
    if (currentClaimId) {
      deleteExpenseMutation.mutate({ id, claimId: currentClaimId });
    }
  };

  const handleSubmit = () => {
    if (!currentClaimId) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma despesa antes de submeter.",
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

    submitClaimMutation.mutate(currentClaimId);
  };

  const handleSaveDraft = () => {
    if (!currentClaimId) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma despesa antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    saveDraftMutation.mutate();
  };

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/expenses")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nova Requisição de Despesas</h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados da requisição
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de Requisição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requester">Requisitante *</Label>
              <Select value={requesterId} onValueChange={setRequesterId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione o requisitante" />
                </SelectTrigger>
                <SelectContent>
                  {expenseRequesters?.map((requester) => (
                    <SelectItem key={requester.id} value={requester.id}>
                      {requester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="claimDate">Data da Requisição *</Label>
              <Input
                id="claimDate"
                type="date"
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <RadioGroup
              value={claimType}
              onValueChange={(value) =>
                setClaimType(value as "reembolso" | "justificacao_cartao")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reembolso" id="reembolso" />
                <Label htmlFor="reembolso">Reembolso de Despesas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="justificacao_cartao"
                  id="justificacao_cartao"
                />
                <Label htmlFor="justificacao_cartao">
                  Justificação de Cartão de Crédito
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description">Descrição Geral</Label>
            <Textarea
              id="description"
              placeholder="ex: Viagem a Lisboa, Material escritório"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
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
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Comprovativo</TableHead>
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
                    <TableCell>
                      {categories?.find((c) => c.id === expense.category_id)?.name || "-"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(expense.amount))}
                    </TableCell>
                    <TableCell>
                      {projects?.find((p) => p.id === expense.project_id)?.name ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {expense.receipt_image_url ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (expense.receipt_image_url) {
                              window.open(expense.receipt_image_url, '_blank');
                            }
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
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
              <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={projectOpen}
                    className="w-full justify-between"
                  >
                    {expenseForm.project_id
                      ? projects?.find((p) => p.id === expenseForm.project_id)?.name || "Nenhum"
                      : "Nenhum"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Procurar projeto..." />
                    <CommandList>
                      <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setExpenseForm({ ...expenseForm, project_id: "" });
                            setProjectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !expenseForm.project_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Nenhum
                        </CommandItem>
                        {projects?.map((project) => (
                          <CommandItem
                            key={project.id}
                            value={project.name}
                            onSelect={() => {
                              setExpenseForm({ ...expenseForm, project_id: project.id });
                              setProjectOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                expenseForm.project_id === project.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {project.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="category">Categoria (opcional)</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between font-normal"
                  >
                    {expenseForm.category_id
                      ? categories?.find((c) => c.id === expenseForm.category_id)?.name
                      : "Selecione uma categoria"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar categoria..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setExpenseForm({ ...expenseForm, category_id: "" });
                            setCategoryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !expenseForm.category_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Nenhuma
                        </CommandItem>
                        {categories
                          ?.slice()
                          .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
                          .map((category) => (
                            <CommandItem
                              key={category.id}
                              value={category.name}
                              onSelect={() => {
                                setExpenseForm({ ...expenseForm, category_id: category.id });
                                setCategoryOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  expenseForm.category_id === category.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {category.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="receipt">Comprovativo *</Label>
              <Input
                id="receipt"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    receipt_file: e.target.files?.[0],
                  })
                }
              />
              {expenseForm.receipt_file && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Ficheiro selecionado: {expenseForm.receipt_file.name}
                </p>
              )}
              {editingExpense?.receipt_image_url && !expenseForm.receipt_file && (
                <p className="text-sm text-muted-foreground mt-2">
                  Comprovativo já anexado. Pode carregar um novo para substituir.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceites: JPG, PNG, PDF (máx. 5MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowExpenseDialog(false);
                setEditingExpense(null);
                resetExpenseForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddExpense}
              disabled={
                !expenseForm.expense_date ||
                !expenseForm.description ||
                !expenseForm.supplier ||
                !expenseForm.amount ||
                parseFloat(expenseForm.amount.replace(',', '.')) <= 0 ||
                (!editingExpense && !expenseForm.receipt_file)
              }
            >
              {editingExpense ? "Atualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewExpensePage;
