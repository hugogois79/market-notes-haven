import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  Building2,
  MapPin,
  Calendar,
  Euro,
  Users,
  FileText,
  TrendingUp,
  Wrench,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface PropertyDrawerProps {
  property: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDrawer({ property, open, onOpenChange }: PropertyDrawerProps) {
  // Fetch units for this property
  const { data: units = [] } = useQuery({
    queryKey: ["real-estate-units", property?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("real_estate_units")
        .select("*")
        .eq("property_id", property?.id)
        .order("unit_name");

      if (error) throw error;
      return data;
    },
    enabled: !!property?.id,
  });

  // Fetch recent ledger entries
  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ["real-estate-ledger", property?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("real_estate_ledger")
        .select("*")
        .eq("property_id", property?.id)
        .order("transaction_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!property?.id,
  });

  if (!property) return null;

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

  const TypeIcon = property.property_type === "residential" ? Home : Building2;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TypeIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">{property.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(property.status)}
                  <Badge variant="outline" className="capitalize">
                    {property.property_type === "residential" ? "Residencial" : "Comercial"}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          {property.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {property.address}
                {property.city && `, ${property.city}`}
                {property.postal_code && ` ${property.postal_code}`}
              </span>
            </div>
          )}
        </SheetHeader>

        <Separator className="my-6" />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Euro className="h-4 w-4" />
              <span>Preço de Compra</span>
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(property.purchase_price || 0)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Valor Atual</span>
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(property.current_value || 0)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 space-y-1">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Euro className="h-4 w-4" />
              <span>Rendas Cobradas</span>
            </div>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">
              {formatCurrency(property.total_rents_collected || 0)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 space-y-1">
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <Wrench className="h-4 w-4" />
              <span>Manutenção</span>
            </div>
            <p className="text-lg font-semibold text-red-700 dark:text-red-300">
              {formatCurrency(property.total_maintenance_cost || 0)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Resumo</TabsTrigger>
            <TabsTrigger value="units" className="flex-1">Frações</TabsTrigger>
            <TabsTrigger value="ledger" className="flex-1">Movimentos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              {property.purchase_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Compra</p>
                    <p className="font-medium">
                      {format(new Date(property.purchase_date), "d 'de' MMMM, yyyy", { locale: pt })}
                    </p>
                  </div>
                </div>
              )}

              {property.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Notas</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{property.notes}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            {units.length > 0 ? (
              <div className="space-y-2">
                {units.map((unit: any) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{unit.unit_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {unit.unit_type}
                        {unit.area_sqm && ` • ${unit.area_sqm} m²`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(unit.rent_amount || 0)}</p>
                      <Badge variant={unit.is_occupied ? "default" : "secondary"}>
                        {unit.is_occupied ? "Ocupado" : "Livre"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma fração registada</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ledger" className="space-y-4">
            {ledgerEntries.length > 0 ? (
              <div className="space-y-2">
                {ledgerEntries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{entry.description || entry.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(entry.transaction_date), "d MMM yyyy", { locale: pt })}
                      </p>
                    </div>
                    <p
                      className={`font-medium ${
                        entry.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {entry.type === "income" ? "+" : "-"}
                      {formatCurrency(Math.abs(entry.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum movimento registado</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
