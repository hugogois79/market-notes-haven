
import { useState } from 'react';
import { format } from "date-fns";
import { TaoValidator, TaoContactLog } from "@/services/taoValidatorService";
import { toast } from "sonner";

interface UseContactLogFormProps {
  validator?: TaoValidator;
  contactLog?: TaoContactLog;
  onSubmit: (data: Omit<TaoContactLog, "id" | "created_at" | "updated_at">) => Promise<void>;
}

export const useContactLogForm = ({ validator, contactLog, onSubmit }: UseContactLogFormProps) => {
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
  const [attachments, setAttachments] = useState<string[]>(contactLog?.attachments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatorId) {
      toast.error("Please select a validator");
      return;
    }

    setIsSubmitting(true);
    try {
      const contactData = {
        validator_id: validatorId,
        subnet_id: subnetId ? parseInt(subnetId) : null,
        contact_date: format(date, "yyyy-MM-dd"),
        method,
        summary,
        next_steps: nextSteps || null,
        linked_note_id: null,
        attachment_url: attachments.length > 0 ? attachments[0] : null,
        attachments
      };
      
      await onSubmit(contactData);
      toast.success("Contact log saved successfully");
    } catch (error) {
      console.error("Error submitting contact log:", error);
      toast.error("Failed to save contact log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};
