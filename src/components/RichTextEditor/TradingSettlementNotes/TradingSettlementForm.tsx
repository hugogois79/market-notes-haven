
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createTradingSettlementNote, updateTradingSettlementNote } from "@/services/tradingSettlementService";
import { TradingSettlementNote } from "@/types";
import { toast } from "sonner";

const formSchema = z.object({
  tradeDate: z.date(),
  settlementDate: z.date().optional(),
  assetSymbol: z.string().min(1, "Asset symbol is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  tradeType: z.enum(["buy", "sell", "short", "cover"]),
  fees: z.coerce.number().nonnegative("Fees must be zero or positive").optional(),
  pnl: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TradingSettlementFormProps {
  noteId: string;
  existingNote?: TradingSettlementNote;
  onSuccess: () => void;
  onCancel: () => void;
}

const TradingSettlementForm: React.FC<TradingSettlementFormProps> = ({
  noteId,
  existingNote,
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default values for the form
  const defaultValues: FormValues = existingNote
    ? {
        tradeDate: existingNote.tradeDate,
        settlementDate: existingNote.settlementDate,
        assetSymbol: existingNote.assetSymbol,
        quantity: existingNote.quantity,
        price: existingNote.price,
        tradeType: existingNote.tradeType,
        fees: existingNote.fees,
        pnl: existingNote.pnl,
        notes: existingNote.notes,
      }
    : {
        tradeDate: new Date(),
        assetSymbol: "",
        quantity: undefined as unknown as number,
        price: undefined as unknown as number,
        tradeType: "buy" as const,
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Calculate P&L if not provided for buy/sell trades
      if (values.tradeType === "sell" && !values.pnl) {
        const entryPrice = form.getValues("price");
        const quantity = form.getValues("quantity");
        values.pnl = (values.price - entryPrice) * quantity;
      }

      if (existingNote) {
        // Update existing note
        const result = await updateTradingSettlementNote({
          id: existingNote.id,
          noteId,
          ...values,
        });
        if (result) {
          toast.success("Trading settlement note updated");
          onSuccess();
        }
      } else {
        // Create new note
        const result = await createTradingSettlementNote({
          noteId,
          ...values,
        });
        if (result) {
          toast.success("Trading settlement note created");
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error saving trading settlement note:", error);
      toast.error("Failed to save trading settlement note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trade Date */}
          <FormField
            control={form.control}
            name="tradeDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Trade Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Settlement Date (Optional) */}
          <FormField
            control={form.control}
            name="settlementDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Settlement Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Asset Symbol */}
        <FormField
          control={form.control}
          name="assetSymbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Symbol</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., BTC, ETH, AAPL" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Trade Type */}
          <FormField
            control={form.control}
            name="tradeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trade Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="cover">Cover</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fees */}
          <FormField
            control={form.control}
            name="fees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fees (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* P&L */}
          <FormField
            control={form.control}
            name="pnl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>P&L (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add any additional notes about this trade"
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : existingNote
              ? "Update Trade"
              : "Add Trade"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TradingSettlementForm;
