import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { StaffProfile } from "./StaffDirectory";

type StaffFormProps = {
  staff: StaffProfile | null;
  onSuccess: () => void;
  onCancel: () => void;
};

const StaffForm = ({ staff, onSuccess, onCancel }: StaffFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: staff?.full_name || "",
    role_category: staff?.role_category || "Office",
    specific_title: staff?.specific_title || "",
    status: staff?.status || "Active",
    phone: staff?.contact_info?.phone || "",
    email: staff?.contact_info?.email || "",
    base_salary: staff?.base_salary?.toString() || "",
    hire_date: staff?.hire_date || "",
    notes: staff?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const payload: any = {
        user_id: user.id,
        full_name: formData.full_name,
        role_category: formData.role_category,
        specific_title: formData.specific_title || null,
        status: formData.status,
        contact_info: {
          phone: formData.phone || null,
          email: formData.email || null,
        },
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : null,
        hire_date: formData.hire_date || null,
        notes: formData.notes || null,
      };

      if (staff) {
        const { error } = await supabase
          .from("staff_profiles")
          .update(payload)
          .eq("id", staff.id);

        if (error) throw error;
        toast.success("Staff member updated");
      } else {
        const { error } = await supabase
          .from("staff_profiles")
          .insert(payload);

        if (error) throw error;
        toast.success("Staff member added");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error("Failed to save staff member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="role_category">Role Category *</Label>
          <Select
            value={formData.role_category}
            onValueChange={(value) => setFormData({ ...formData, role_category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Aviation">Aviation</SelectItem>
              <SelectItem value="Maritime">Maritime</SelectItem>
              <SelectItem value="Ground">Ground</SelectItem>
              <SelectItem value="Office">Office</SelectItem>
              <SelectItem value="Household">Household</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Leave">On Leave</SelectItem>
              <SelectItem value="Mission">On Mission</SelectItem>
              <SelectItem value="Terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="specific_title">Specific Title</Label>
          <Input
            id="specific_title"
            placeholder="e.g., Lead Pilot, Personal Assistant"
            value={formData.specific_title}
            onChange={(e) => setFormData({ ...formData, specific_title: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="base_salary">Base Salary</Label>
          <Input
            id="base_salary"
            type="number"
            step="0.01"
            value={formData.base_salary}
            onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="hire_date">Hire Date</Label>
          <Input
            id="hire_date"
            type="date"
            value={formData.hire_date}
            onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Performance notes, investigation involvement, etc."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : staff ? "Update" : "Add Staff"}
        </Button>
      </div>
    </form>
  );
};

export default StaffForm;
