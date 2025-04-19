
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
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { SequenceStep } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Wand2 } from "lucide-react";

interface ContentPersonalizationProps {
  form: UseFormReturn<SequenceStep>;
}

const ContentPersonalization: React.FC<ContentPersonalizationProps> = ({ form }) => {
  const insertPersonalizationField = (field: string) => {
    const content = form.getValues('content');
    const placeholder = `{{${field}}}`;
    const newContent = content ? `${content} ${placeholder}` : placeholder;
    form.setValue('content', newContent);
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Personalization Fields</h3>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-7"
            onClick={() => insertPersonalizationField("validator.name")}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => insertPersonalizationField("validator.name")}
          >
            name
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => insertPersonalizationField("validator.organization")}
          >
            organization
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => insertPersonalizationField("validator.email")}
          >
            email
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => insertPersonalizationField("subnet.name")}
          >
            subnet name
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => insertPersonalizationField("crm_stage")}
          >
            relationship stage
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => insertPersonalizationField("last_contacted")}
          >
            last contacted
          </Badge>
        </div>
      </div>
      
      {form.watch("channelType") === "email" && (
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Subject</FormLabel>
              <FormControl>
                <Input placeholder="Enter email subject" {...field} />
              </FormControl>
              <FormDescription>
                You can use personalization fields like {"{"}{"{"} validator.name {"}"}{"}"} 
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      <FormField
        control={form.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Message Content</FormLabel>
            <FormControl>
              <Textarea 
                placeholder={`Enter your message here. Use personalization fields like {{validator.name}}.`} 
                className="min-h-[200px] font-mono text-sm"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="toneStyle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tone & Style</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || "professional"}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Adjust the tone based on relationship stage and stakeholder
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="pt-4">
        <Button type="button" variant="outline" className="w-full" onClick={() => {}}>
          <Wand2 className="h-4 w-4 mr-2" /> 
          Generate Content with AI
        </Button>
      </div>
    </div>
  );
};

export default ContentPersonalization;
