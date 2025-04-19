
import React from "react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { SequenceStep } from "../types";
import TriggerConfiguration from "./TriggerConfiguration";
import ContentPersonalization from "./ContentPersonalization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X } from "lucide-react";

interface SequenceStepEditorProps {
  step: SequenceStep;
  onSave: (step: SequenceStep) => void;
  onCancel: () => void;
}

const SequenceStepEditor: React.FC<SequenceStepEditorProps> = ({
  step,
  onSave,
  onCancel
}) => {
  const form = useForm<SequenceStep>({
    defaultValues: step
  });

  const handleSubmit = (data: SequenceStep) => {
    onSave({
      ...data,
      id: step.id
    });
  };

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">
          {step.id.startsWith('step-') ? 'Add New Step' : 'Edit Step'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Initial Outreach" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="channelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Channel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="message">Direct Message</SelectItem>
                        <SelectItem value="calendar">Calendar Invite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Step Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose of this step" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="trigger">
              <TabsList className="mb-4">
                <TabsTrigger value="trigger">Trigger Configuration</TabsTrigger>
                <TabsTrigger value="content">Content & Personalization</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trigger">
                <TriggerConfiguration form={form} />
              </TabsContent>
              
              <TabsContent value="content">
                <ContentPersonalization form={form} />
              </TabsContent>
              
              <TabsContent value="conditions">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Conditional Execution</h3>
                  <p className="text-sm text-muted-foreground">
                    Define conditions under which this step should be executed.
                    This is an advanced feature that will be implemented in future releases.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" /> Save Step
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SequenceStepEditor;
