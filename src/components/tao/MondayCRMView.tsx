
import React, { useState } from "react";
import { 
  TaoValidator,
  TaoContactLog,
  TaoNote,
  deleteValidator,
  updateValidator
} from "@/services/taoValidatorService";
import { TaoSubnet } from "@/services/taoSubnetService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  Mail,
  MessageCircle,
  ExternalLink,
  Phone,
  FileText,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  Users,
  UserPlus,
  Clock,
  LayoutGrid,
  Trash2,
  Edit,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface MondayCRMViewProps {
  validators: TaoValidator[];
  subnets: TaoSubnet[];
  contactLogs: TaoContactLog[];
  notes: TaoNote[];
  validatorsBySubnet: Record<number, string[]>;
  validatorNames: Record<string, string>;
  subnetNames: Record<number, string>;
  onAddValidator: () => void;
  onEditValidator: (validator: TaoValidator) => void;
  onAddContactLog: (validator?: TaoValidator) => void;
  onAddNote: (validator?: TaoValidator, subnet?: TaoSubnet) => void;
  onViewContactLog: (contactLog: TaoContactLog) => void;
  onRefreshData: () => void;
}

const MondayCRMView: React.FC<MondayCRMViewProps> = ({
  validators,
  subnets,
  contactLogs,
  notes,
  validatorsBySubnet,
  validatorNames,
  subnetNames,
  onAddValidator,
  onEditValidator,
  onAddContactLog,
  onAddNote,
  onViewContactLog,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["validators", "subnets"]);
  const [selectedView, setSelectedView] = useState<"main" | "kanban">("main");

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  const filteredValidators = validators.filter(validator => 
    validator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (validator.email && validator.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (validator.telegram && validator.telegram.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSubnets = subnets.filter(subnet => 
    subnet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subnet.description && subnet.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteValidator = async (validator: TaoValidator) => {
    if (window.confirm(`Are you sure you want to delete validator "${validator.name}"?`)) {
      try {
        const success = await deleteValidator(validator.id);
        if (success) {
          toast.success(`Deleted validator "${validator.name}"`);
          onRefreshData();
        } else {
          toast.error("Failed to delete validator");
        }
      } catch (error) {
        console.error("Error deleting validator:", error);
        toast.error("An error occurred during deletion");
      }
    }
  };

  const handleUpdateValidatorStage = async (validator: TaoValidator, newStage: TaoValidator["crm_stage"]) => {
    try {
      const result = await updateValidator(validator.id, { crm_stage: newStage });
      if (result) {
        toast.success(`Updated ${validator.name} to "${newStage}" stage`);
        onRefreshData();
      } else {
        toast.error("Failed to update validator stage");
      }
    } catch (error) {
      console.error("Error updating validator stage:", error);
      toast.error("An error occurred while updating");
    }
  };

  const handleUpdateValidatorPriority = async (validator: TaoValidator, newPriority: TaoValidator["priority"]) => {
    try {
      const result = await updateValidator(validator.id, { priority: newPriority });
      if (result) {
        toast.success(`Updated ${validator.name} to "${newPriority}" priority`);
        onRefreshData();
      } else {
        toast.error("Failed to update validator priority");
      }
    } catch (error) {
      console.error("Error updating validator priority:", error);
      toast.error("An error occurred while updating");
    }
  };

  const getContactLogsByValidator = (validatorId: string) => {
    return contactLogs.filter(log => log.validator_id === validatorId)
      .sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())
      .slice(0, 3); // Show only the most recent 3
  };

  const getNotesByValidator = (validatorId: string) => {
    return notes.filter(note => note.validator_id === validatorId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 2); // Show only the most recent 2
  };

  const getStageColor = (stage: TaoValidator["crm_stage"]) => {
    switch (stage) {
      case "Prospect":
        return "bg-blue-100 text-blue-800";
      case "Contacted":
        return "bg-purple-100 text-purple-800";
      case "Follow-up":
        return "bg-yellow-100 text-yellow-800";
      case "Negotiation":
        return "bg-orange-100 text-orange-800";
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: TaoValidator["priority"]) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodIcon = (method: TaoContactLog["method"]) => {
    switch (method) {
      case "Email":
        return <Mail className="h-4 w-4" />;
      case "Telegram":
        return <MessageCircle className="h-4 w-4" />;
      case "Call":
        return <Phone className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const validatorsByStage = {
    "Prospect": filteredValidators.filter(v => v.crm_stage === "Prospect"),
    "Contacted": filteredValidators.filter(v => v.crm_stage === "Contacted"),
    "Follow-up": filteredValidators.filter(v => v.crm_stage === "Follow-up"),
    "Negotiation": filteredValidators.filter(v => v.crm_stage === "Negotiation"),
    "Active": filteredValidators.filter(v => v.crm_stage === "Active"),
    "Inactive": filteredValidators.filter(v => v.crm_stage === "Inactive")
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex space-x-2">
          <Button 
            variant={selectedView === "main" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedView("main")}
          >
            <Users className="h-4 w-4 mr-2" />
            Main Table
          </Button>
          <Button 
            variant={selectedView === "kanban" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedView("kanban")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
            <Input
              placeholder="Search validators, subnets..."
              className="pl-9 w-[280px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={onAddValidator} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Validator
          </Button>
        </div>
      </div>

      {selectedView === "main" ? (
        <div className="space-y-6">
          <Accordion
            type="multiple"
            value={expandedGroups}
            onValueChange={setExpandedGroups}
            className="border rounded-md"
          >
            <AccordionItem value="validators" className="border-b">
              <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 data-[state=open]:bg-gray-50">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="font-medium">Validators</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {filteredValidators.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="border-t">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-[300px]">Name</TableHead>
                          <TableHead>Contact Info</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Recent Contact</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredValidators.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                              No validators found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredValidators.map((validator) => {
                            const recentContacts = getContactLogsByValidator(validator.id);
                            const recentNotes = getNotesByValidator(validator.id);
                            
                            return (
                              <TableRow key={validator.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">
                                  {validator.name}
                                  {validator.wallet_address && (
                                    <div className="text-xs text-muted-foreground mt-1 truncate" title={validator.wallet_address}>
                                      {validator.wallet_address.substring(0, 8)}...{validator.wallet_address.substring(validator.wallet_address.length - 8)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {validator.email && (
                                      <a href={`mailto:${validator.email}`} className="flex items-center text-sm hover:text-blue-600">
                                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                                        {validator.email}
                                      </a>
                                    )}
                                    {validator.telegram && (
                                      <a href={`https://t.me/${validator.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm hover:text-blue-600">
                                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                                        {validator.telegram}
                                      </a>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className={`px-3 py-1 h-auto text-xs ${getStageColor(validator.crm_stage)}`}>
                                        {validator.crm_stage}
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Prospect")}>
                                        Prospect
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Contacted")}>
                                        Contacted
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Follow-up")}>
                                        Follow-up
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Negotiation")}>
                                        Negotiation
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Active")}>
                                        Active
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Inactive")}>
                                        Inactive
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className={`px-3 py-1 h-auto text-xs ${getPriorityColor(validator.priority)}`}>
                                        {validator.priority}
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => handleUpdateValidatorPriority(validator, "High")}>
                                        High
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateValidatorPriority(validator, "Medium")}>
                                        Medium
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateValidatorPriority(validator, "Low")}>
                                        Low
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                                <TableCell>
                                  {recentContacts.length > 0 ? (
                                    <div className="space-y-2">
                                      {recentContacts.map(contact => (
                                        <div key={contact.id} className="flex items-start">
                                          <div className="flex-shrink-0 mr-2 mt-0.5">
                                            {getMethodIcon(contact.method)}
                                          </div>
                                          <div className="text-sm">
                                            <div className="font-medium">{format(new Date(contact.contact_date), "MMM d, yyyy")}</div>
                                            <div className="text-muted-foreground line-clamp-1">
                                              {contact.summary || "No summary"}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-6 mt-1"
                                        onClick={() => onAddContactLog(validator)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add contact
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => onAddContactLog(validator)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add first contact
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {recentNotes.length > 0 ? (
                                    <div className="space-y-2">
                                      {recentNotes.map(note => (
                                        <div key={note.id} className="flex items-start">
                                          <div className="flex-shrink-0 mr-2 mt-0.5">
                                            <FileText className="h-4 w-4" />
                                          </div>
                                          <div className="text-sm">
                                            <div className="font-medium line-clamp-1">{note.title}</div>
                                            <div className="text-muted-foreground line-clamp-1">
                                              {note.content?.substring(0, 50) || "No content"}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-6 mt-1"
                                        onClick={() => onAddNote(validator)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add note
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => onAddNote(validator)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add first note
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEditValidator(validator)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onAddContactLog(validator)}>
                                          <Clock className="h-4 w-4 mr-2" />
                                          Add Contact Log
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onAddNote(validator)}>
                                          <FileText className="h-4 w-4 mr-2" />
                                          Add Note
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteValidator(validator)}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="subnets" className="border-b-0">
              <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 data-[state=open]:bg-gray-50">
                <div className="flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-purple-600" />
                  <span className="font-medium">Subnets</span>
                  <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
                    {filteredSubnets.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="border-t">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-[200px]">Name</TableHead>
                          <TableHead className="w-[300px]">Description</TableHead>
                          <TableHead>Validators</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Neurons</TableHead>
                          <TableHead>Emission</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubnets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                              No subnets found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSubnets.map((subnet) => {
                            const linkedValidatorIds = validatorsBySubnet[subnet.id] || [];
                            const linkedValidators = validators.filter(v => linkedValidatorIds.includes(v.id));
                            
                            return (
                              <TableRow key={subnet.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">
                                  {subnet.name}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {subnet.description || "No description"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {linkedValidators.length > 0 ? (
                                      linkedValidators.slice(0, 3).map(v => (
                                        <Badge key={v.id} variant="outline" className="bg-gray-50">
                                          {v.name}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">No validators</span>
                                    )}
                                    {linkedValidators.length > 3 && (
                                      <Badge variant="outline" className="bg-gray-50">
                                        +{linkedValidators.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                                    Tier {subnet.tier}
                                  </Badge>
                                </TableCell>
                                <TableCell>{subnet.neurons}</TableCell>
                                <TableCell>{subnet.emission}</TableCell>
                                <TableCell>
                                  <div className="flex justify-end">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onAddNote(undefined, subnet)}>
                                          <FileText className="h-4 w-4 mr-2" />
                                          Add Note
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ) : (
        // Kanban board view
        <div className="flex overflow-x-auto pb-4 pt-2 space-x-4">
          {Object.entries(validatorsByStage).map(([stage, validators]) => (
            <div key={stage} className="flex-shrink-0 w-[320px]">
              <div className={`px-3 py-2 rounded-t-md ${getStageColor(stage as TaoValidator["crm_stage"])}`}>
                <h3 className="font-medium flex items-center justify-between">
                  <span>{stage}</span>
                  <span className="text-xs">{validators.length} validators</span>
                </h3>
              </div>
              
              <div className="bg-gray-50 rounded-b-md p-2 h-[calc(100vh-320px)] overflow-y-auto">
                {validators.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                    No validators
                  </div>
                ) : (
                  <div className="space-y-2">
                    {validators.map(validator => {
                      const recentContacts = getContactLogsByValidator(validator.id);
                      
                      return (
                        <div key={validator.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{validator.name}</div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditValidator(validator)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddContactLog(validator)}>
                                  Add Contact Log
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddNote(validator)}>
                                  Add Note
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getPriorityColor(validator.priority)}>
                              {validator.priority}
                            </Badge>
                            <div className="flex space-x-1">
                              {validator.email && (
                                <a
                                  href={`mailto:${validator.email}`}
                                  className="text-gray-500 hover:text-blue-600"
                                  title={validator.email}
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              )}
                              {validator.telegram && (
                                <a
                                  href={`https://t.me/${validator.telegram.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-500 hover:text-blue-600"
                                  title={validator.telegram}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                          
                          {recentContacts.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-2">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  Last contact: {format(new Date(recentContacts[0].contact_date), "MMM d, yyyy")} 
                                  via {recentContacts[0].method}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 border border-dashed border-gray-300 text-muted-foreground"
                  onClick={onAddValidator}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Validator
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MondayCRMView;
