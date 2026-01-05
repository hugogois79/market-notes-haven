import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { wealthService } from "@/services/wealthService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Real Estate',
  'Crypto',
  'Fine Art',
  'Watches',
  'Vehicles',
  'Private Equity',
  'Cash',
  'Other',
];

const STATUSES = ['Active', 'Pending', 'Recovery'];

const AssetFormDialog = ({ open, onOpenChange, onSuccess }: AssetFormDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    purchase_date: '',
    purchase_price: '',
    current_value: '',
    status: 'Active',
    yield_percent: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      return wealthService.createAsset({
        user_id: user?.id || null,
        name: data.name,
        category: data.category,
        subcategory: data.subcategory || null,
        purchase_date: data.purchase_date || null,
        purchase_price: parseFloat(data.purchase_price) || 0,
        current_value: parseFloat(data.current_value) || 0,
        currency: 'EUR',
        status: data.status,
        yield_percent: data.yield_percent ? parseFloat(data.yield_percent) : null,
        notes: data.notes || null,
        image_url: null,
        metadata: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wealth-assets'] });
      toast.success("Asset created successfully");
      onOpenChange(false);
      onSuccess();
      resetForm();
    },
    onError: () => toast.error("Failed to create asset"),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      purchase_date: '',
      purchase_price: '',
      current_value: '',
      status: 'Active',
      yield_percent: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error("Please fill in required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Asset Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Apartment Lisbon Centro"
              />
            </div>

            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subcategory</Label>
              <Input
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                placeholder="e.g., Montblanc Pens"
              />
            </div>

            <div>
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Purchase Price (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Current Value (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="col-span-2">
              <Label>Yield (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.yield_percent}
                onChange={(e) => setFormData({ ...formData, yield_percent: e.target.value })}
                placeholder="e.g., 5.5"
              />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssetFormDialog;
