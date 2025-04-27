
import React from "react";
import { TaoValidator, TaoContactLog } from "@/services/taoValidatorService";
import { TaoSubnet } from "@/services/taoSubnetService";
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
import { useContactLogForm } from "./contact-log/useContactLogForm";
import DatePickerField from "./contact-log/DatePickerField";
import AttachmentsSection from "./contact-log/AttachmentsSection";

interface ContactLogFormProps {
  validator?: TaoValidator;
  subnets: TaoSubnet[];
  contactLog?: TaoContactLog;
  onSubmit: (data: Omit<TaoContactLog, "id" | "created_at" | "updated_at">) => Promise<void>;
  onCancel: () => void;
}

const ContactLogForm: React.FC<ContactLogFormProps> = ({
  validator,
  subnets,
  contactLog,
  onSubmit,
  onCancel,
}) => {
  const {
    validatorId,
    setValidatorId,
    subnetId,
    setSubnetId,
    date,
    setDate,
    method,
    setMethod,
    summary,
    setSummary,
    nextSteps,
    setNextSteps,
    attachments,
    setAttachments,
    isSubmitting,
    handleSubmit
  } = useContactLogForm({ validator, contactLog, onSubmit });

  const contactMethods: TaoContactLog['method'][] = [
    "Email", "Call", "Meeting", "Telegram", "Discord", "Other"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="validator">Validator</Label>
        <Select
          value={validatorId}
          onValueChange={setValidatorId}
          disabled={!!validator || !!contactLog}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select validator" />
          </SelectTrigger>
          <SelectContent>
            {validator && (
              <SelectItem value={validator.id}>{validator.name}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subnet">Subnet (Optional)</Label>
        <Select value={subnetId} onValueChange={setSubnetId}>
          <SelectTrigger>
            <SelectValue placeholder="Select subnet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {subnets.map((subnet) => (
              <SelectItem key={subnet.id} value={subnet.id.toString()}>
                {subnet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DatePickerField date={date} onDateChange={setDate} />

      <div className="space-y-2">
        <Label htmlFor="method">Contact Method</Label>
        <Select 
          value={method} 
          onValueChange={(value: TaoContactLog['method']) => setMethod(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contactMethods.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder="What was discussed during this contact?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextSteps">Next Steps</Label>
        <Textarea
          id="nextSteps"
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          rows={2}
          placeholder="What are the next steps after this interaction?"
        />
      </div>

      {validatorId && (
        <AttachmentsSection
          validatorId={validatorId}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
        />
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : contactLog ? "Update Log" : "Save Log"}
        </Button>
      </div>
    </form>
  );
};

export default ContactLogForm;
