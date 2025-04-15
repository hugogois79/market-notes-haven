
import React, { useState, useEffect } from "react";
import { TaoValidator, TaoSubnet, TaoNote } from "@/services/taoValidatorService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface NoteFormProps {
  validators: TaoValidator[];
  subnets: TaoSubnet[];
  validator?: TaoValidator;
  subnet?: TaoSubnet;
  note?: TaoNote;
  onSubmit: (data: Omit<TaoNote, "id" | "created_at" | "updated_at">) => Promise<void>;
  onCancel: () => void;
}

const NoteForm: React.FC<NoteFormProps> = ({
  validators,
  subnets,
  validator,
  subnet,
  note,
  onSubmit,
  onCancel,
}) => {
  const [validatorId, setValidatorId] = useState<string | undefined>(
    validator ? validator.id : note?.validator_id
  );
  const [subnetId, setSubnetId] = useState<string | undefined>(
    subnet ? subnet.id.toString() : note?.subnet_id ? String(note.subnet_id) : undefined
  );
  const [title, setTitle] = useState<string>(note?.title || "");
  const [content, setContent] = useState<string>(note?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        validator_id: validatorId,
        subnet_id: subnetId ? parseInt(subnetId) : undefined,
        title,
        content,
      });
    } catch (error) {
      console.error("Error submitting note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="validator">Linked Validator (Optional)</Label>
        <Select 
          value={validatorId} 
          onValueChange={setValidatorId}
          disabled={!!validator}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select validator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {validators.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subnet">Linked Subnet (Optional)</Label>
        <Select 
          value={subnetId} 
          onValueChange={setSubnetId}
          disabled={!!subnet}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subnet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {subnets.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Note content"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : note ? "Update Note" : "Create Note"}
        </Button>
      </div>
    </form>
  );
};

export default NoteForm;
