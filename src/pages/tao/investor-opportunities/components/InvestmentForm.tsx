
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Investment, SubnetProject } from "../types";

const investmentFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().nonempty("Date is required"),
  status: z.enum(["committed", "pending", "deployed", "exited"], {
    required_error: "Status is required",
  }),
  notes: z.string().optional(),
});

type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

interface InvestmentFormProps {
  investment?: Investment;
  project: SubnetProject;
  onSubmit: (values: InvestmentFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({
  investment,
  project,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: {
      amount: investment?.amount || 0,
      date: investment?.date 
        ? new Date(investment.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      status: investment?.status || "committed",
      notes: investment?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">
            {investment ? "Edit Investment" : "Add Investment"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {project.name} - {project.stage} stage
          </p>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Investment Amount ($)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Investment Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="committed">Committed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                  <SelectItem value="exited">Exited</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Investment"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default InvestmentForm;
