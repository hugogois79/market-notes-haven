
import React from "react";
import { useForm } from "react-hook-form";
import { TaoContactLog, TaoValidator } from "@/services/taoValidatorService";
import { TaoSubnet } from "@/services/taoSubnetService";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ContactLogFormProps {
  validator?: TaoValidator;
  subnets: TaoSubnet[];
  contactLog?: TaoContactLog;
  onSubmit: (data: Omit<TaoContactLog, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

type FormValues = Omit<TaoContactLog, "id" | "created_at" | "updated_at">;

const ContactLogForm: React.FC<ContactLogFormProps> = ({
  validator,
  subnets,
  contactLog,
  onSubmit,
  onCancel,
}) => {
  const today = format(new Date(), "yyyy-MM-dd");

  const form = useForm<FormValues>({
    defaultValues: contactLog
      ? {
          validator_id: contactLog.validator_id,
          subnet_id: contactLog.subnet_id,
          contact_date: format(new Date(contactLog.contact_date), "yyyy-MM-dd"),
          method: contactLog.method,
          summary: contactLog.summary || "",
          next_steps: contactLog.next_steps || "",
          linked_note_id: contactLog.linked_note_id,
        }
      : {
          validator_id: validator?.id || "",
          subnet_id: null,
          contact_date: today,
          method: "Email",
          summary: "",
          next_steps: "",
          linked_note_id: null,
        },
  });

  const handleSubmit = (values: FormValues) => {
    // Convert empty strings to null for optional fields
    const subnetId = values.subnet_id === "" ? null : values.subnet_id;
    
    onSubmit({
      ...values,
      subnet_id: subnetId,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {!validator && (
          <FormField
            control={form.control}
            name="validator_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validator</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Validator ID"
                    {...field}
                    disabled={contactLog !== undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="contact_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Telegram">Telegram</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="DM">DM</SelectItem>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                    <SelectItem value="In Person">In Person</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subnet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Subnet (Optional)</FormLabel>
                <Select
                  onValueChange={(value) => {
                    if (value === "null") {
                      field.onChange(null);
                    } else {
                      field.onChange(parseInt(value, 10));
                    }
                  }}
                  defaultValue={field.value !== null ? field.value.toString() : "null"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subnet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    {subnets.map((subnet) => (
                      <SelectItem key={subnet.id} value={subnet.id.toString()}>
                        {subnet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what was discussed during the contact"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="next_steps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next Steps</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe any follow-up actions or next steps"
                  {...field}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit">
            {contactLog ? "Update Contact Log" : "Add Contact Log"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ContactLogForm;
