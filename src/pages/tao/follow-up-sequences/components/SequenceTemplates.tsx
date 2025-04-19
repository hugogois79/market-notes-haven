
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, Clock, Calendar, MessageSquare, Copy, CheckCircle2, Users } from "lucide-react";
import { Sequence, SequenceTemplate } from "../types";
import { toast } from "sonner";

// Mock template data
const mockTemplates: SequenceTemplate[] = [
  {
    id: "template-1",
    name: "Validator Onboarding",
    description: "A 4-step sequence to welcome and onboard new validators",
    stakeholderType: "validator",
    stageType: "prospect",
    steps: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    effectiveness: 0.85,
    usage: 42
  },
  {
    id: "template-2",
    name: "Subnet Owner Follow-up",
    description: "A series of communications to engage subnet owners",
    stakeholderType: "subnet_owner",
    stageType: "contacted",
    steps: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    effectiveness: 0.72,
    usage: 18
  },
  {
    id: "template-3",
    name: "Investor Opportunity",
    description: "Present investment opportunities to qualified investors",
    stakeholderType: "investor",
    stageType: "qualified",
    steps: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    effectiveness: 0.91,
    usage: 27
  },
  {
    id: "template-4",
    name: "Technical Updates",
    description: "Keep validators updated on technical changes",
    stakeholderType: "validator",
    stageType: "active",
    steps: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    effectiveness: 0.78,
    usage: 63
  },
  {
    id: "template-5",
    name: "Disengagement Recovery",
    description: "Re-engage validators who have become inactive",
    stakeholderType: "validator",
    stageType: "inactive",
    steps: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    effectiveness: 0.67,
    usage: 14
  }
];

const SequenceTemplates = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const filteredTemplates = mockTemplates.filter(template => {
    if (activeTab !== "all" && template.stakeholderType !== activeTab) {
      return false;
    }
    
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !template.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  const getStakeholderIcon = (type: string) => {
    switch (type) {
      case "validator":
        return <Avatar className="h-8 w-8 bg-blue-100"><AvatarFallback className="bg-blue-100 text-blue-700">V</AvatarFallback></Avatar>;
      case "subnet_owner":
        return <Avatar className="h-8 w-8 bg-purple-100"><AvatarFallback className="bg-purple-100 text-purple-700">S</AvatarFallback></Avatar>;
      case "investor":
        return <Avatar className="h-8 w-8 bg-green-100"><AvatarFallback className="bg-green-100 text-green-700">I</AvatarFallback></Avatar>;
      default:
        return <Avatar className="h-8 w-8"><AvatarFallback>?</AvatarFallback></Avatar>;
    }
  };
  
  const useTemplate = (templateId: string) => {
    toast.success("Template applied to new sequence");
    // TODO: Implement template usage logic
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sequence Template Library</CardTitle>
          <CardDescription>
            Pre-built communication sequences optimized for blockchain stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <Input 
              placeholder="Search templates..." 
              className="max-w-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" /> Create New Template
            </Button>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="validator">Validator</TabsTrigger>
              <TabsTrigger value="subnet_owner">Subnet Owner</TabsTrigger>
              <TabsTrigger value="investor">Investor</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="pt-6">
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <div className="border-l-4 border-primary h-full flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-3">
                              {getStakeholderIcon(template.stakeholderType)}
                              <div>
                                <CardTitle className="text-base">{template.name}</CardTitle>
                                <CardDescription className="text-xs">
                                  {template.steps} steps • {template.usage} uses
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant={template.effectiveness > 0.8 ? "success" : (template.effectiveness > 0.7 ? "default" : "outline")}>
                              {Math.round(template.effectiveness * 100)}% effective
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2 pt-0">
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="bg-primary/5">
                              {template.stakeholderType.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline" className="bg-primary/5">
                              {template.stageType}
                            </Badge>
                            {template.id === "template-1" && (
                              <>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">email</Badge>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">time-based</Badge>
                              </>
                            )}
                            {template.id === "template-3" && (
                              <>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">calendar</Badge>
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">A/B tested</Badge>
                              </>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-2">
                          <div className="flex gap-2 w-full">
                            <Button variant="outline" className="w-full" onClick={() => useTemplate(template.id)}>
                              <Copy className="h-4 w-4 mr-2" /> Use Template
                            </Button>
                            <Button variant="ghost">Preview</Button>
                          </div>
                        </CardFooter>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md border-dashed">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No templates found</h3>
                  <p className="text-muted-foreground mb-4">
                    No sequence templates match your current filters
                  </p>
                  <Button onClick={() => {
                    setActiveTab("all");
                    setSearchQuery("");
                  }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SequenceTemplates;
