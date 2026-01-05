import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Upload, Trash2, TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { WealthAsset, wealthService, formatEUR, calculatePL, WealthAssetValuation } from "@/services/wealthService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AssetDetailDrawerProps {
  asset: WealthAsset | null;
  onClose: () => void;
  onUpdate: () => void;
}

const AssetDetailDrawer = ({ asset, onClose, onUpdate }: AssetDetailDrawerProps) => {
  const queryClient = useQueryClient();
  const [newValuation, setNewValuation] = useState({ value: '', date: '', notes: '' });

  const { data: valuations = [] } = useQuery({
    queryKey: ['asset-valuations', asset?.id],
    queryFn: () => asset ? wealthService.getAssetValuations(asset.id) : [],
    enabled: !!asset,
  });

  const addValuationMutation = useMutation({
    mutationFn: (data: Omit<WealthAssetValuation, 'id' | 'created_at'>) =>
      wealthService.createValuation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-valuations', asset?.id] });
      toast.success("Valuation added");
      setNewValuation({ value: '', date: '', notes: '' });
    },
    onError: () => toast.error("Failed to add valuation"),
  });

  const deleteAssetMutation = useMutation({
    mutationFn: () => asset ? wealthService.deleteAsset(asset.id) : Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wealth-assets'] });
      toast.success("Asset deleted");
      onClose();
      onUpdate();
    },
    onError: () => toast.error("Failed to delete asset"),
  });

  const updateAssetMutation = useMutation({
    mutationFn: (updates: Partial<WealthAsset>) => 
      asset ? wealthService.updateAsset(asset.id, updates) : Promise.resolve(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wealth-assets'] });
      toast.success("Asset updated");
      onUpdate();
    },
    onError: () => toast.error("Failed to update asset"),
  });

  if (!asset) return null;

  const pl = calculatePL(asset.purchase_price, asset.current_value);

  const chartData = valuations.length > 0
    ? valuations.map(v => ({
        date: format(new Date(v.valuation_date), 'MMM yy'),
        value: v.value,
      }))
    : [
        { date: 'Purchase', value: asset.purchase_price },
        { date: 'Current', value: asset.current_value },
      ];

  const handleAddValuation = () => {
    if (!newValuation.value || !newValuation.date) return;
    addValuationMutation.mutate({
      asset_id: asset.id,
      valuation_date: newValuation.date,
      value: parseFloat(newValuation.value),
      notes: newValuation.notes || null,
    });
  };

  return (
    <Sheet open={!!asset} onOpenChange={() => onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{asset.name}</SheetTitle>
            <Badge className={cn(
              asset.status === 'Active' && "bg-emerald-100 text-emerald-700",
              asset.status === 'Recovery' && "bg-amber-100 text-amber-700",
              asset.status === 'Pending' && "bg-blue-100 text-blue-700",
            )}>
              {asset.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{asset.category} {asset.subcategory && `• ${asset.subcategory}`}</p>
        </SheetHeader>

        <div className="space-y-6">
          {/* Asset Image */}
          <div className="relative">
            {asset.image_url ? (
              <img
                src={asset.image_url}
                alt={asset.name}
                className="w-full h-48 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-48 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">No image uploaded</p>
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs uppercase">Current Value</span>
                </div>
                <p className="text-xl font-bold font-mono">{formatEUR(asset.current_value)}</p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  {pl.value >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-xs uppercase">P/L</span>
                </div>
                <p className={cn(
                  "text-xl font-bold font-mono",
                  pl.value >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {pl.value >= 0 ? '+' : ''}{formatEUR(pl.value)}
                </p>
                <p className={cn(
                  "text-sm font-mono",
                  pl.value >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {pl.percent >= 0 ? '+' : ''}{pl.percent.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Purchase Price</span>
              <span className="font-mono">{formatEUR(asset.purchase_price)}</span>
            </div>
            {asset.purchase_date && (
              <div className="flex justify-between">
                <span className="text-slate-500">Purchase Date</span>
                <span>{format(new Date(asset.purchase_date), 'dd/MM/yyyy')}</span>
              </div>
            )}
            {asset.yield_percent && (
              <div className="flex justify-between">
                <span className="text-slate-500">Yield</span>
                <span className="font-mono">{asset.yield_percent.toFixed(2)}%</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Valuation History Chart */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Valuation History</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatEUR(value), 'Value']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Add Valuation */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Add Valuation</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Value (EUR)</Label>
                <Input
                  type="number"
                  value={newValuation.value}
                  onChange={(e) => setNewValuation({ ...newValuation, value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={newValuation.date}
                  onChange={(e) => setNewValuation({ ...newValuation, date: e.target.value })}
                />
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={handleAddValuation}
              disabled={!newValuation.value || !newValuation.date}
            >
              Add Valuation
            </Button>
          </div>

          <Separator />

          {/* Notes */}
          {asset.notes && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Notes</h4>
              <p className="text-sm text-slate-600">{asset.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Delete this asset?')) {
                  deleteAssetMutation.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Asset
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AssetDetailDrawer;
