
import React from "react";
import { useForm } from "react-hook-form";
import { TaoNote, TaoValidator } from "@/services/taoValidatorService";
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

interface NoteFormProps {
  validator?: TaoValidator;
  subnet?: TaoSubnet;
  note?: TaoNote;
  validators: TaoValidator[];
  subnets: TaoSubnet[];
  onSubmit: (data: Omit<TaoNote, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

type FormValues = Omit<TaoNote, "id" | "created_at" | "updated_at">;

const NoteForm: React.FC<NoteFormProps> = ({
  validator,
  subnet,
  note,
  validators,
  subnets,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<FormValues>({
    defaultValues: note
      ? {
          title: note.title,
          content: note.content || "",
          validator_id: note.validator_id,
          subnet_id: note.subnet_id,
        }
      : {
          title: "",
          content: "",
          validator_id: validator?.id || null,
          subnet_id: subnet?.id || null,
        },
  });

  const handleSubmit = (values: FormValues) => {
    // Convert empty strings to null for optional fields
    const validatorId = values.validator_id === "" ? null : values.validator_id;
    const subnetId = values.subnet_id === "" ? null : values.subnet_id;
    
    onSubmit({
      ...values,
      validator_id: validatorId,
      subnet_id: subnetId as number | null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Note title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {!validator && (
            <FormField
              control={form.control}
              name="validator_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Validator (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                    defaultValue={field.value !== null ? field.value.toString() : "null"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select validator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">None</SelectItem>
                      {validators.map((validator) => (
                        <SelectItem key={validator.id} value={validator.id}>
                          {validator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!subnet && (
            <FormField
              control={form.control}
              name="subnet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Subnet (Optional)</FormLabel>
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
          )}
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Note content"
                  {...field}
                  rows={8}
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
            {note ? "Update Note" : "Create Note"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NoteForm;
