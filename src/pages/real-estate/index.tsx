import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Search, 
  Building2, 
  Home, 
  ChevronDown, 
  ChevronRight,
  Filter,
  Users,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertyDialog } from "@/components/real-estate/PropertyDialog";
import { PropertyDrawer } from "@/components/real-estate/PropertyDrawer";

type Property = {
  id: string;
  name: string;
  property_type: string;
  status: string;
  address: string | null;
  city: string | null;
  purchase_price: number;
  current_value: number;
  total_maintenance_cost: number;
  total_rents_collected: number;
  created_at: string;
};

type GroupedProperties = {
  [key: string]: {
    properties: Property[];
    totals: {
      purchase_price: number;
      maintenance: number;
      rents: number;
    };
  };
};

export default function RealEstatePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("properties");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["residential", "commercial"]));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsDialogOpen(true);
    setIsDrawerOpen(false);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingProperty(null);
    }
  };

  // Fetch properties
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["real-estate-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("real_estate_properties")
        .select("*")
        .order("property_type", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Property[];
    },
    enabled: !!user,
  });

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, searchQuery, statusFilter]);

  // Group properties by type
  const groupedProperties = useMemo<GroupedProperties>(() => {
    const groups: GroupedProperties = {
      residential: { properties: [], totals: { purchase_price: 0, maintenance: 0, rents: 0 } },
      commercial: { properties: [], totals: { purchase_price: 0, maintenance: 0, rents: 0 } },
    };

    filteredProperties.forEach((property) => {
      const type = property.property_type || "residential";
      if (!groups[type]) {
        groups[type] = { properties: [], totals: { purchase_price: 0, maintenance: 0, rents: 0 } };
      }
      groups[type].properties.push(property);
      groups[type].totals.purchase_price += property.purchase_price || 0;
      groups[type].totals.maintenance += property.total_maintenance_cost || 0;
      groups[type].totals.rents += property.total_rents_collected || 0;
    });

    return groups;
  }, [filteredProperties]);

  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedGroups(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      active: { className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Ativo" },
      maintenance: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Manutenção" },
      vacant: { className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "Vago" },
      sold: { className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Vendido" },
    };
    const variant = variants[status] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === "residential" ? (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        Residencial
      </Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
        Comercial
      </Badge>
    );
  };

  const handleRowClick = (property: Property) => {
    setSelectedProperty(property);
    setIsDrawerOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imobiliário</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de propriedades residenciais e comerciais
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              {activeTab === "tenants" ? "Novo Inquilino" : activeTab === "projects" ? "Novo Projeto" : "Nova Propriedade"}
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="gap-2 cursor-pointer">
              <Building2 size={16} />
              Nova Propriedade
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
              <Users size={16} />
              Novo Inquilino
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
              <Briefcase size={16} />
              Novo Projeto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building2 size={16} />
            Propriedades
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <Users size={16} />
            Inquilinos
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Briefcase size={16} />
            Projetos
          </TabsTrigger>
        </TabsList>

        {/* Properties Tab */}
        <TabsContent value="properties">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar propriedades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="vacant">Vagos</SelectItem>
                <SelectItem value="sold">Vendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grouped Table */}
          <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Preço de Compra</TableHead>
                  <TableHead className="text-right">Manutenção</TableHead>
                  <TableHead className="text-right">Rendas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedProperties).map(([type, group]) => {
                  if (group.properties.length === 0) return null;
                  const isExpanded = expandedGroups.has(type);
                  const TypeIcon = type === "residential" ? Home : Building2;

                  return (
                    <>
                      {/* Group Header Row */}
                      <TableRow
                        key={`group-${type}`}
                        className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                        onClick={() => toggleGroup(type)}
                      >
                        <TableCell className="py-3">
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-muted-foreground" />
                          ) : (
                            <ChevronRight size={16} className="text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <TypeIcon size={16} className="text-muted-foreground" />
                            <span className="uppercase text-xs text-muted-foreground">
                              Tipo de Propriedade
                            </span>
                            {getTypeBadge(type)}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({group.properties.length})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-medium text-muted-foreground">
                          Σ {formatCurrency(group.totals.purchase_price)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-muted-foreground">
                          Σ {formatCurrency(group.totals.maintenance)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-muted-foreground">
                          Σ {formatCurrency(group.totals.rents)}
                        </TableCell>
                      </TableRow>

                      {/* Property Rows */}
                      {isExpanded &&
                        group.properties.map((property, index) => (
                          <TableRow
                            key={property.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleRowClick(property)}
                          >
                            <TableCell className="py-2">
                              <div
                                className={cn(
                                  "w-1 h-6 rounded-full ml-2",
                                  type === "residential" ? "bg-blue-400" : "bg-purple-400"
                                )}
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-6">
                                  {index + 1}
                                </span>
                                <span className="font-medium">{property.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">{getTypeBadge(property.property_type)}</TableCell>
                            <TableCell className="py-2">{getStatusBadge(property.status)}</TableCell>
                            <TableCell className="py-2 text-right">
                              {formatCurrency(property.purchase_price || 0)}
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              {formatCurrency(property.total_maintenance_cost || 0)}
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              {formatCurrency(property.total_rents_collected || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </>
                  );
                })}

                {filteredProperties.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {isLoading ? (
                        <span className="text-muted-foreground">A carregar...</span>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Building2 size={32} className="text-muted-foreground/50" />
                          <span className="text-muted-foreground">
                            Nenhuma propriedade encontrada
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDialogOpen(true)}
                          >
                            Adicionar primeira propriedade
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={48} className="text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Gestão de Inquilinos</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Aqui poderá gerir todos os inquilinos, contratos de arrendamento e histórico de pagamentos.
            </p>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase size={48} className="text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Projetos de Manutenção</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Aqui poderá gerir projetos de renovação, manutenção e melhorias das propriedades.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Property Dialog */}
      <PropertyDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        property={editingProperty}
      />

      {/* Property Drawer */}
      <PropertyDrawer
        property={selectedProperty}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onEdit={handleEditProperty}
      />
    </div>
  );
}
