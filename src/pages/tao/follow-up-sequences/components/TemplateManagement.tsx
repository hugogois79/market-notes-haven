
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Copy, 
  Edit, 
  Trash2, 
  ChevronDown, 
  FilterX, 
  ListFilter, 
  Clock, 
  ArrowUpDown,
  FileText
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SequenceTemplate } from "../types";
import { toast } from "sonner";

// Mock template versions data
const mockTemplateVersions: (SequenceTemplate & { version: number, author: string })[] = [
  {
    id: "template-1-v3",
    name: "Validator Onboarding",
    description: "A 4-step sequence to welcome and onboard new validators",
    stakeholderType: "validator",
    stageType: "prospect",
    steps: 4,
    createdAt: new Date("2023-04-15"),
    updatedAt: new Date("2023-04-15"),
    effectiveness: 0.85,
    usage: 42,
    version: 3,
    author: "Alex Johnson"
  },
  {
    id: "template-1-v2",
    name: "Validator Onboarding",
    description: "A 4-step sequence to welcome and onboard new validators",
    stakeholderType: "validator",
    stageType: "prospect",
    steps: 4,
    createdAt: new Date("2023-03-22"),
    updatedAt: new Date("2023-03-22"),
    effectiveness: 0.79,
    usage: 31,
    version: 2,
    author: "Maria Chen"
  },
  {
    id: "template-1-v1",
    name: "Validator Onboarding",
    description: "A 3-step sequence to welcome new validators",
    stakeholderType: "validator",
    stageType: "prospect",
    steps: 3,
    createdAt: new Date("2023-02-10"),
    updatedAt: new Date("2023-02-10"),
    effectiveness: 0.68,
    usage: 15,
    version: 1,
    author: "Alex Johnson"
  },
  {
    id: "template-2-v2",
    name: "Subnet Owner Follow-up",
    description: "A series of communications to engage subnet owners",
    stakeholderType: "subnet_owner",
    stageType: "contacted",
    steps: 3,
    createdAt: new Date("2023-03-30"),
    updatedAt: new Date("2023-03-30"),
    effectiveness: 0.72,
    usage: 18,
    version: 2,
    author: "Cameron Lee"
  },
  {
    id: "template-2-v1",
    name: "Subnet Owner Follow-up",
    description: "A series of communications to engage subnet owners",
    stakeholderType: "subnet_owner",
    stageType: "contacted",
    steps: 2,
    createdAt: new Date("2023-02-18"),
    updatedAt: new Date("2023-02-18"),
    effectiveness: 0.65,
    usage: 12,
    version: 1,
    author: "Cameron Lee"
  }
];

const TemplateManagement = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stakeholderFilter, setStakeholderFilter] = useState<string>("all");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  
  // Filter the templates
  const uniqueTemplateNames = Array.from(new Set(mockTemplateVersions.map(t => t.name)));
  const latestVersionsByTemplate = uniqueTemplateNames.map(name => {
    return mockTemplateVersions
      .filter(t => t.name === name)
      .sort((a, b) => b.version - a.version)[0];
  });
  
  // Apply filter and search
  const filteredTemplates = latestVersionsByTemplate.filter(template => {
    if (stakeholderFilter !== "all" && template.stakeholderType !== stakeholderFilter) {
      return false;
    }
    
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !template.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Get versions for a specific template
  const getTemplateVersions = (templateName: string) => {
    return mockTemplateVersions
      .filter(t => t.name === templateName)
      .sort((a, b) => b.version - a.version);
  };
  
  // Handle template operations
  const duplicateTemplate = (templateId: string) => {
    toast.success("Template duplicated successfully");
  };
  
  const editTemplate = (templateId: string) => {
    toast.info("Editing template...");
  };
  
  const deleteTemplate = (templateId: string) => {
    toast.success("Template deleted successfully");
  };
  
  const restoreVersion = (templateId: string, version: number) => {
    toast.success(`Restored template to version ${version}`);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Management</CardTitle>
          <CardDescription>
            Manage and version your sequence templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <Input 
                placeholder="Search templates..." 
                className="md:w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select 
                value={stakeholderFilter} 
                onValueChange={setStakeholderFilter}
              >
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stakeholders</SelectItem>
                  <SelectItem value="validator">Validator</SelectItem>
                  <SelectItem value="subnet_owner">Subnet Owner</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setStakeholderFilter("all");
              }}>
                <FilterX className="h-4 w-4 mr-2" /> Clear Filters
              </Button>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" /> New Template
              </Button>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Stakeholder</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-center">Version</TableHead>
                <TableHead className="text-center">Effectiveness</TableHead>
                <TableHead className="text-center">Usage</TableHead>
                <TableHead className="text-center">Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <React.Fragment key={template.id}>
                  <TableRow className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {template.stakeholderType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {template.stageType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Badge variant="secondary">{template.version}.0</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`font-medium ${
                        template.effectiveness > 0.8 ? 'text-green-600' : 
                        template.effectiveness > 0.7 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {Math.round(template.effectiveness * 100)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{template.usage}</TableCell>
                    <TableCell className="text-center">
                      {template.updatedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => duplicateTemplate(template.id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => editTemplate(template.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setExpandedTemplate(expandedTemplate === template.name ? null : template.name)}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${
                            expandedTemplate === template.name ? 'rotate-180' : ''
                          }`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {expandedTemplate === template.name && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={8} className="p-0">
                        <div className="p-4">
                          <div className="mb-3 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <h4 className="font-medium">Version History</h4>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Version</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Steps</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Effectiveness</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getTemplateVersions(template.name).map((version) => (
                                <TableRow key={version.id} className="hover:bg-muted/50">
                                  <TableCell>
                                    <Badge variant={version.version === template.version ? "secondary" : "outline"}>
                                      v{version.version}.0
                                      {version.version === template.version && " (current)"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{version.description}</TableCell>
                                  <TableCell>{version.steps} steps</TableCell>
                                  <TableCell>{version.author}</TableCell>
                                  <TableCell>{version.createdAt.toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <div className={`font-medium ${
                                      version.effectiveness > 0.8 ? 'text-green-600' : 
                                      version.effectiveness > 0.7 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                      {Math.round(version.effectiveness * 100)}%
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {version.version !== template.version && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => restoreVersion(version.id, version.version)}
                                      >
                                        Restore
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              
              {filteredTemplates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No templates found</p>
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSearchQuery("");
                        setStakeholderFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateManagement;
