import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
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
};

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

const DocumentUploadForm = ({ onSuccess, onCancel }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    staff_id: "",
    doc_type: "Other",
    issue_date: "",
    expiry_date: "",
    notes: "",
  });

  useEffect(() => {
    const fetchStaff = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name")
        .eq("user_id", user.id)
        .order("full_name");

      if (!error && data) {
        setStaff(data);
      }
    };

    fetchStaff();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !formData.staff_id) {
      toast.error("Please select a staff member and upload a file");
      return;
    }

    setLoading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${formData.staff_id}/documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("staff-vault")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("staff-vault")
        .getPublicUrl(filePath);

      // Save document record
      const { error: dbError } = await supabase
        .from("contracts_docs")
        .insert({
          user_id: user.id,
          staff_id: formData.staff_id,
          doc_type: formData.doc_type as any,
          file_name: file.name,
          file_url: urlData.publicUrl,
          issue_date: formData.issue_date || null,
          expiry_date: formData.expiry_date || null,
          notes: formData.notes || null,
          is_verified: false,
        });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully");
      onSuccess();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
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
                {s.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="doc_type">Document Type *</Label>
        <Select
          value={formData.doc_type}
          onValueChange={(value) => setFormData({ ...formData, doc_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NDA">NDA</SelectItem>
            <SelectItem value="Employment_Contract">Employment Contract</SelectItem>
            <SelectItem value="Passport">Passport</SelectItem>
            <SelectItem value="License">License</SelectItem>
            <SelectItem value="Medical_Cert">Medical Certificate</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="file">File *</Label>
        <div className="mt-1">
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          {file && (
            <p className="text-sm text-muted-foreground mt-1">
              Selected: {file.name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issue_date">Issue Date</Label>
          <Input
            id="issue_date"
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="expiry_date">Expiry Date</Label>
          <Input
            id="expiry_date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes about this document..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !file || !formData.staff_id}>
          <Upload className="w-4 h-4 mr-2" />
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  );
};

export default DocumentUploadForm;
