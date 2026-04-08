
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
import { Plus, Save, Clock, Calendar, MessageSquare, Mail, Send, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import TriggerConfiguration from "./TriggerConfiguration";
import SequenceStepEditor from "./SequenceStepEditor";
import { Sequence, SequenceStep, TriggerType } from "../types";

const SequenceBuilder = () => {
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [currentStep, setCurrentStep] = useState<SequenceStep | null>(null);
  const [isEditingStep, setIsEditingStep] = useState<boolean>(false);

  const form = useForm<Omit<Sequence, 'steps' | 'id' | 'createdAt' | 'updatedAt'>>({
    defaultValues: {
      name: "",
      description: "",
      stakeholderType: "validator",
      stageType: "prospect",
      isActive: false
    }
  });

  const onSubmit = (data: Omit<Sequence, 'steps' | 'id' | 'createdAt' | 'updatedAt'>) => {
    if (steps.length === 0) {
      toast.error("Please add at least one step to your sequence");
      return;
    }

    const sequence: Omit<Sequence, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      steps
    };

    // TODO: Save sequence to database
    console.log("Sequence to save:", sequence);
    
    toast.success("Sequence saved successfully");
  };

  const handleAddStep = () => {
    setCurrentStep({
      id: `step-${Date.now()}`,
      name: "",
      description: "",
      channelType: "email",
      content: "",
      triggerType: "time",
      triggerValue: "1",
      triggerUnit: "days",
      conditions: [],
      personalizationFields: []
    });
    setIsEditingStep(true);
  };

  const handleSaveStep = (step: SequenceStep) => {
    const stepIndex = steps.findIndex(s => s.id === step.id);
    if (stepIndex >= 0) {
      // Update existing step
      const updatedSteps = [...steps];
      updatedSteps[stepIndex] = step;
      setSteps(updatedSteps);
    } else {
      // Add new step
      setSteps([...steps, step]);
    }
    setCurrentStep(null);
    setIsEditingStep(false);
  };

  const handleEditStep = (step: SequenceStep) => {
    setCurrentStep(step);
    setIsEditingStep(true);
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Follow-Up Sequence</CardTitle>
          <CardDescription>
            Build a communication workflow for blockchain stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sequence Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Validator Onboarding" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stakeholderType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stakeholder Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stakeholder type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="validator">Validator</SelectItem>
                          <SelectItem value="subnet_owner">Subnet Owner</SelectItem>
                          <SelectItem value="investor">Investor</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="stageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="engaged">Engaged</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="committed">Committed</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "active")} 
                        defaultValue={field.value ? "active" : "draft"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Only active sequences will be automatically executed
                      </FormDescription>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose and goals of this sequence" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border p-4 rounded-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Sequence Steps</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddStep}
                    disabled={isEditingStep}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Step
                  </Button>
                </div>
                
                {steps.length === 0 && !isEditingStep ? (
                  <div className="text-center py-8 border border-dashed rounded-md">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No steps added yet. Add your first step to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.id} className="border rounded-md p-4 bg-muted/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">
                                {index + 1}
                              </div>
                              <h4 className="font-medium">{step.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {step.channelType === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                            {step.channelType === 'message' && <MessageSquare className="h-4 w-4 text-green-500" />}
                            {step.channelType === 'calendar' && <Calendar className="h-4 w-4 text-purple-500" />}
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditStep(step)}
                              disabled={isEditingStep}
                            >
                              Edit
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveStep(step.id)}
                              disabled={isEditingStep}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          {step.triggerType === 'time' && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>After {step.triggerValue} {step.triggerUnit}</span>
                            </div>
                          )}
                          {step.triggerType === 'event' && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>On event: {step.triggerValue}</span>
                            </div>
                          )}
                          {step.triggerType === 'engagement' && (
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              <span>After engagement: {step.triggerValue}</span>
                            </div>
                          )}
                        </div>
                        {index < steps.length - 1 && (
                          <div className="flex justify-center my-3">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {isEditingStep && currentStep && (
                  <SequenceStepEditor 
                    step={currentStep} 
                    onSave={handleSaveStep}
                    onCancel={() => {
                      setCurrentStep(null);
                      setIsEditingStep(false);
                    }}
                  />
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" /> Save Sequence
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SequenceBuilder;
