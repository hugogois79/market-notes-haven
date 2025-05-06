import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { InvestmentPreference } from "../types";
import { toast } from "@/components/ui/use-toast";

interface InvestmentProfileManagerProps {
  preferences: InvestmentPreference[];
  selectedPreference: InvestmentPreference | null;
  onSelectPreference: (preference: InvestmentPreference) => void;
  onSavePreference: (preference: InvestmentPreference) => Promise<InvestmentPreference>;
  isLoading: boolean;
  availableSubnets?: Array<{id: string, name: string}>;
}

const preferencesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subnetTypes: z.array(z.string()).min(1, "At least one subnet type is required"),
  technicalFocus: z.array(z.string()).min(1, "At least one technical focus is required"),
  stagePreferences: z.array(z.enum(["early", "growth", "established"])).min(1, "At least one stage preference is required"),
  minTicketSize: z.number().min(1000, "Minimum ticket size must be at least 1000"),
  maxTicketSize: z.number().min(1000, "Maximum ticket size must be at least 1000"),
  requiresCoInvestment: z.boolean(),
  decisionTimelineDays: z.number().min(1, "Decision timeline must be at least 1 day"),
  riskTolerance: z.enum(["low", "medium", "high"])
});

const InvestmentProfileManager: React.FC<InvestmentProfileManagerProps> = ({
  preferences,
  selectedPreference,
  onSelectPreference,
  onSavePreference,
  isLoading,
  availableSubnets = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newSubnetType, setNewSubnetType] = useState("");
  const [newTechnicalFocus, setNewTechnicalFocus] = useState("");
  const [selectedSubnet, setSelectedSubnet] = useState<string>("");

  const form = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: selectedPreference ? {
      name: selectedPreference.name,
      subnetTypes: selectedPreference.subnetTypes,
      technicalFocus: selectedPreference.technicalFocus,
      stagePreferences: selectedPreference.stagePreferences,
      minTicketSize: selectedPreference.minTicketSize,
      maxTicketSize: selectedPreference.maxTicketSize,
      requiresCoInvestment: selectedPreference.requiresCoInvestment,
      decisionTimelineDays: selectedPreference.decisionTimelineDays,
      riskTolerance: selectedPreference.riskTolerance
    } : {
      name: "",
      subnetTypes: [],
      technicalFocus: [],
      stagePreferences: [],
      minTicketSize: 50000,
      maxTicketSize: 500000,
      requiresCoInvestment: false,
      decisionTimelineDays: 14,
      riskTolerance: "medium"
    }
  });

  // Update form when selected preference changes
  React.useEffect(() => {
    if (selectedPreference) {
      form.reset({
        name: selectedPreference.name,
        subnetTypes: selectedPreference.subnetTypes,
        technicalFocus: selectedPreference.technicalFocus,
        stagePreferences: selectedPreference.stagePreferences,
        minTicketSize: selectedPreference.minTicketSize,
        maxTicketSize: selectedPreference.maxTicketSize,
        requiresCoInvestment: selectedPreference.requiresCoInvestment,
        decisionTimelineDays: selectedPreference.decisionTimelineDays,
        riskTolerance: selectedPreference.riskTolerance
      });
    }
  }, [selectedPreference, form]);

  const handleCreatePreference = () => {
    form.reset({
      name: "New Investment Profile",
      subnetTypes: [],
      technicalFocus: [],
      stagePreferences: [],
      minTicketSize: 50000,
      maxTicketSize: 500000,
      requiresCoInvestment: false,
      decisionTimelineDays: 14,
      riskTolerance: "medium"
    });
    setIsEditing(true);
  };

  const handleSavePreference = async (data: z.infer<typeof preferencesSchema>) => {
    try {
      // Ensure all required properties are provided with non-optional values
      const preference: InvestmentPreference = {
        id: selectedPreference?.id || `pref${Date.now()}`,
        name: data.name,
        subnetTypes: data.subnetTypes,
        technicalFocus: data.technicalFocus,
        stagePreferences: data.stagePreferences,
        minTicketSize: data.minTicketSize,
        maxTicketSize: data.maxTicketSize,
        requiresCoInvestment: data.requiresCoInvestment,
        decisionTimelineDays: data.decisionTimelineDays,
        riskTolerance: data.riskTolerance,
        createdAt: selectedPreference?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      const savedPreference = await onSavePreference(preference);
      onSelectPreference(savedPreference);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving preference:", error);
    }
  };

  const addSubnetType = () => {
    if (selectedSubnet) {
      const subnet = availableSubnets.find(s => s.id === selectedSubnet);
      if (!subnet) return;
      
      const currentTypes = form.getValues("subnetTypes");
      if (currentTypes.includes(subnet.name)) {
        toast.error("This subnet type already exists");
        return;
      }
      
      form.setValue("subnetTypes", [...currentTypes, subnet.name]);
      setSelectedSubnet("");
    } else if (newSubnetType.trim()) {
      const currentTypes = form.getValues("subnetTypes");
      if (currentTypes.includes(newSubnetType.trim())) {
        toast.error("This subnet type already exists");
        return;
      }
      
      form.setValue("subnetTypes", [...currentTypes, newSubnetType.trim()]);
      setNewSubnetType("");
    }
  };

  const removeSubnetType = (type: string) => {
    const currentTypes = form.getValues("subnetTypes");
    form.setValue("subnetTypes", currentTypes.filter(t => t !== type));
  };

  const addTechnicalFocus = () => {
    if (!newTechnicalFocus.trim()) return;
    
    const currentFocus = form.getValues("technicalFocus");
    if (currentFocus.includes(newTechnicalFocus.trim())) {
      toast.error("This technical focus already exists");
      return;
    }
    
    form.setValue("technicalFocus", [...currentFocus, newTechnicalFocus.trim()]);
    setNewTechnicalFocus("");
  };

  const removeTechnicalFocus = (focus: string) => {
    const currentFocus = form.getValues("technicalFocus");
    form.setValue("technicalFocus", currentFocus.filter(f => f !== focus));
  };

  const toggleStagePreference = (stage: "early" | "growth" | "established") => {
    const currentStages = form.getValues("stagePreferences");
    
    if (currentStages.includes(stage)) {
      if (currentStages.length > 1) { // Ensure at least one stage is selected
        form.setValue("stagePreferences", currentStages.filter(s => s !== stage));
      }
    } else {
      form.setValue("stagePreferences", [...currentStages, stage]);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Investment Profile</CardTitle>
          {!isEditing && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreatePreference}>
                <Plus className="h-4 w-4 mr-2" /> New Profile
              </Button>
            </div>
          )}
        </div>
        <CardDescription>
          Define your investment preferences and criteria
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!isEditing ? (
          <div className="space-y-6">
            {/* Profiles Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium">Select Profile</label>
              <Select
                value={selectedPreference?.id || ""}
                onValueChange={(value) => {
                  const preference = preferences.find(p => p.id === value);
                  if (preference) onSelectPreference(preference);
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {preferences.map((preference) => (
                    <SelectItem key={preference.id} value={preference.id}>
                      {preference.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPreference && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Investment Focus */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Investment Focus</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Subnet Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPreference.subnetTypes.map((type, index) => (
                        <Badge key={index} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Technical Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPreference.technicalFocus.map((focus, index) => (
                        <Badge key={index} variant="secondary">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Stage Preferences</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPreference.stagePreferences.map((stage, index) => (
                        <Badge key={index} variant="secondary">
                          {stage.charAt(0).toUpperCase() + stage.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Investment Parameters */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Investment Parameters</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Min Ticket Size</h4>
                      <p className="text-2xl font-semibold">${selectedPreference.minTicketSize.toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Max Ticket Size</h4>
                      <p className="text-2xl font-semibold">${selectedPreference.maxTicketSize.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Risk Tolerance</h4>
                    <Badge 
                      className={selectedPreference.riskTolerance === "low" ? "bg-green-100 text-green-800" :
                               selectedPreference.riskTolerance === "medium" ? "bg-amber-100 text-amber-800" :
                               "bg-red-100 text-red-800"}
                    >
                      {selectedPreference.riskTolerance.charAt(0).toUpperCase() + selectedPreference.riskTolerance.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Co-Investment Required</h4>
                    <Badge variant={selectedPreference.requiresCoInvestment ? "default" : "outline"}>
                      {selectedPreference.requiresCoInvestment ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Decision Timeline</h4>
                    <p>{selectedPreference.decisionTimelineDays} days</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSavePreference)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <FormLabel>Subnet Types</FormLabel>
                    <div className="flex mt-2 mb-2">
                      {availableSubnets.length > 0 ? (
                        <>
                          <Select
                            value={selectedSubnet}
                            onValueChange={setSelectedSubnet}
                          >
                            <SelectTrigger className="w-[200px] mr-2">
                              <SelectValue placeholder="Select a subnet" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSubnets.map((subnet) => (
                                <SelectItem key={subnet.id} value={subnet.id}>
                                  {subnet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" onClick={addSubnetType} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            value={newSubnetType}
                            onChange={(e) => setNewSubnetType(e.target.value)}
                            placeholder="Add subnet type"
                            className="mr-2"
                          />
                          <Button type="button" onClick={addSubnetType} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch("subnetTypes").map((type, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center">
                          {type}
                          <button
                            type="button"
                            onClick={() => removeSubnetType(type)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    {form.formState.errors.subnetTypes && (
                      <p className="text-sm font-medium text-destructive mt-2">
                        {form.formState.errors.subnetTypes.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <FormLabel>Technical Focus</FormLabel>
                    <div className="flex mt-2 mb-2">
                      <Input
                        value={newTechnicalFocus}
                        onChange={(e) => setNewTechnicalFocus(e.target.value)}
                        placeholder="Add technical focus"
                        className="mr-2"
                      />
                      <Button type="button" onClick={addTechnicalFocus} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch("technicalFocus").map((focus, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center">
                          {focus}
                          <button
                            type="button"
                            onClick={() => removeTechnicalFocus(focus)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    {form.formState.errors.technicalFocus && (
                      <p className="text-sm font-medium text-destructive mt-2">
                        {form.formState.errors.technicalFocus.message}
                      </p>
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="stagePreferences"
                    render={() => (
                      <FormItem>
                        <FormLabel>Stage Preferences</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["early", "growth", "established"].map((stage) => (
                            <Button
                              key={stage}
                              type="button"
                              variant={form.watch("stagePreferences").includes(stage as any) ? "default" : "outline"}
                              onClick={() => toggleStagePreference(stage as "early" | "growth" | "established")}
                              className="text-xs"
                            >
                              {stage.charAt(0).toUpperCase() + stage.slice(1)}
                            </Button>
                          ))}
                        </div>
                        {form.formState.errors.stagePreferences && (
                          <FormMessage>{form.formState.errors.stagePreferences.message}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="minTicketSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Ticket Size (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxTicketSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Ticket Size (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="riskTolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Tolerance</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk tolerance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="requiresCoInvestment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Requires Co-Investment</FormLabel>
                          <FormDescription>
                            Will you require other investors to participate?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="decisionTimelineDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decision Timeline (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" /> Save Profile
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestmentProfileManager;
