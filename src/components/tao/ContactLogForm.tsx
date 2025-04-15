
import React, { useState, useEffect } from "react";
import { TaoValidator, TaoContactLog } from "@/services/taoValidatorService";
import { TaoSubnet } from "@/services/taoValidatorService";
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
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [validatorId, setValidatorId] = useState<string | undefined>(
    validator ? validator.id : contactLog?.validator_id
  );
  const [subnetId, setSubnetId] = useState<string | undefined>(
    contactLog?.subnet_id ? String(contactLog.subnet_id) : undefined
  );
  const [date, setDate] = useState<Date>(
    contactLog?.contact_date ? new Date(contactLog.contact_date) : new Date()
  );
  const [method, setMethod] = useState<TaoContactLog['method']>(contactLog?.method || "Email");
  const [summary, setSummary] = useState<string>(contactLog?.summary || "");
  const [nextSteps, setNextSteps] = useState<string>(contactLog?.next_steps || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatorId) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        validator_id: validatorId,
        subnet_id: subnetId ? parseInt(subnetId) : null,
        contact_date: format(date, "yyyy-MM-dd"),
        method,
        summary,
        next_steps: nextSteps || null,
        linked_note_id: null
      });
    } catch (error) {
      console.error("Error submitting contact log:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods: TaoContactLog['method'][] = ["Email", "Call", "Meeting", "Telegram", "Discord", "Other"];

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

      <div className="space-y-2">
        <Label htmlFor="date">Contact Date</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate);
                  setCalendarOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

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
