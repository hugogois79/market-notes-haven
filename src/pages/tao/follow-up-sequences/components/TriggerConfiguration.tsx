
import React from "react";
import { 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { SequenceStep } from "../types";
import { Clock, Calendar, MessageSquare } from "lucide-react";

interface TriggerConfigurationProps {
  form: UseFormReturn<SequenceStep>;
}

const TriggerConfiguration: React.FC<TriggerConfigurationProps> = ({ form }) => {
  const triggerType = form.watch("triggerType");
  
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="triggerType"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Trigger Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="time" />
                  </FormControl>
                  <FormLabel className="font-normal flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Time-based
                  </FormLabel>
                </FormItem>
                
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="event" />
                  </FormControl>
                  <FormLabel className="font-normal flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-green-500" />
                    Event-based
                  </FormLabel>
                </FormItem>
                
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="engagement" />
                  </FormControl>
                  <FormLabel className="font-normal flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-purple-500" />
                    Engagement-based
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {triggerType === "time" && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="triggerValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delay</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="e.g., 3" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="triggerUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      
      {triggerType === "event" && (
        <FormField
          control={form.control}
          name="triggerValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blockchain Event</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="validator_registration">Validator Registration</SelectItem>
                  <SelectItem value="subnet_join">Subnet Participation</SelectItem>
                  <SelectItem value="stake_change">Stake Change</SelectItem>
                  <SelectItem value="subnet_creation">Subnet Creation</SelectItem>
                  <SelectItem value="performance_alert">Performance Alert</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Sequence will be triggered when this blockchain event occurs
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      {triggerType === "engagement" && (
        <FormField
          control={form.control}
          name="triggerValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Engagement Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select engagement" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="email_opened">Email Opened</SelectItem>
                  <SelectItem value="email_clicked">Link Clicked</SelectItem>
                  <SelectItem value="message_read">Message Read</SelectItem>
                  <SelectItem value="response_received">Response Received</SelectItem>
                  <SelectItem value="no_response">No Response (48h)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Sequence will continue based on engagement with previous communication
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default TriggerConfiguration;
