import React, { useState, useEffect, useRef } from "react";
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
import { Calendar, Upload, Loader2, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { uploadContactLogAttachment } from "@/services/contact-logs/contactLogService";

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
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(contactLog?.attachment_url || null);
  const [attachments, setAttachments] = useState<string[]>(contactLog?.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !validatorId) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => uploadContactLogAttachment(validatorId, file));
      const urls = await Promise.all(uploadPromises);
      
      const successfulUploads = urls.filter((url): url is string => url !== null);
      if (successfulUploads.length > 0) {
        setAttachments(prev => [...prev, ...successfulUploads]);
        toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
        attachment_url: attachments[0] || null,
        attachments
      };
      
      console.log("Submitting contact log:", contactData);
      await onSubmit(contactData);
      toast.success("Contact log saved successfully");
    } catch (error) {
      console.error("Error submitting contact log:", error);
      toast.error("Failed to save contact log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods: TaoContactLog['method'][] = ["Email", "Call", "Meeting", "Telegram", "Discord", "Other"];

  const removeAttachment = (urlToRemove: string) => {
    setAttachments(prev => prev.filter(url => url !== urlToRemove));
    toast.success("Attachment removed");
  };

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

      {/* Attachments Section */}
      <div className="space-y-2">
        <Label>Attachments</Label>
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        {attachments.length === 0 ? (
          <Button 
            type="button"
            variant="outline" 
            className="w-full flex items-center justify-center gap-2" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Attachments
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            {attachments.map((url, index) => (
              <div key={url} className="border rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate">
                    {new URL(url).pathname.split('/').pop()}
                  </span>
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  onClick={() => removeAttachment(url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button 
              type="button"
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 mt-2" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Add More Attachments
                </>
              )}
            </Button>
          </div>
        )}
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
