import { useState, useEffect } from "react";
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

type StaffOption = {
  id: string;
  full_name: string;
  role_category: string;
};

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

const VacationForm = ({ onSuccess, onCancel }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    staff_id: "",
    start_date: "",
    end_date: "",
    vacation_type: "Paid",
    approval_status: "Approved",
    notes: "",
  });

  useEffect(() => {
    const fetchStaff = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, role_category")
        .eq("user_id", user.id)
        .order("full_name");

      if (!error && data) {
        setStaff(data);
      }
    };

    fetchStaff();
  }, [user]);

  // Check for conflicts when dates or staff change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!user || !formData.staff_id || !formData.start_date || !formData.end_date) {
        setConflicts([]);
        return;
      }

      const selectedStaff = staff.find((s) => s.id === formData.staff_id);
      if (!selectedStaff) return;

      try {
        const { data, error } = await supabase
          .rpc("check_vacation_conflicts", {
            p_user_id: user.id,
            p_start_date: formData.start_date,
            p_end_date: formData.end_date,
            p_role_category: selectedStaff.role_category as any,
          });

        if (!error && data) {
          setConflicts(data.map((c: any) => c.conflicting_staff_name));
        }
      } catch (error) {
        console.error("Error checking conflicts:", error);
      }
    };

    checkConflicts();
  }, [user, formData.staff_id, formData.start_date, formData.end_date, staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.staff_id || !formData.start_date || !formData.end_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("vacation_logs")
        .insert({
          user_id: user.id,
          staff_id: formData.staff_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          vacation_type: formData.vacation_type as any,
          approval_status: formData.approval_status as any,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast.success("Vacation request added");
      onSuccess();
    } catch (error) {
      console.error("Error adding vacation:", error);
      toast.error("Failed to add vacation request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="staff_id">Staff Member *</Label>
        <Select
          value={formData.staff_id}
          onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select staff member" />
          </SelectTrigger>
          <SelectContent>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name} ({s.role_category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_date">End Date *</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Conflict Warning */}
      {conflicts.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800 text-amber-200 text-sm">
          <strong>⚠️ Coverage Conflict:</strong> The following staff in the same role are already on leave during this period:
          <ul className="mt-1 ml-4 list-disc">
            {conflicts.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vacation_type">Leave Type *</Label>
          <Select
            value={formData.vacation_type}
            onValueChange={(value) => setFormData({ ...formData, vacation_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paid">Paid Leave</SelectItem>
              <SelectItem value="Sick">Sick Leave</SelectItem>
              <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="approval_status">Status *</Label>
          <Select
            value={formData.approval_status}
            onValueChange={(value) => setFormData({ ...formData, approval_status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Reason for leave, coverage arrangements, etc."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Vacation"}
        </Button>
      </div>
    </form>
  );
};

export default VacationForm;
