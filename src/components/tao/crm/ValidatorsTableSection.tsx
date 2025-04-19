import React from "react";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Users, Plus, Mail, MessageCircle, FileText, Edit, Clock, Trash2, MoreHorizontal, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TaoValidator, TaoContactLog, TaoNote, deleteValidator, updateValidatorStage, updateValidator } from "@/services/taoValidatorService";
import { toast } from "sonner";
import { getStageColor, getPriorityColor } from "./crmUtils";

interface ValidatorsTableSectionProps {
  validators: TaoValidator[];
  contactLogs: TaoContactLog[];
  notes: TaoNote[];
  onEditValidator: (validator: TaoValidator) => void;
  onAddContactLog: (validator?: TaoValidator) => void;
  onAddNote: (validator?: TaoValidator) => void;
  onViewContactLog: (log: TaoContactLog) => void;
  onRefreshData: () => void;
  onAddValidator: () => void;
}

const ValidatorsTableSection: React.FC<ValidatorsTableSectionProps> = ({
  validators,
  contactLogs,
  notes,
  onEditValidator,
  onAddContactLog,
  onAddNote,
  onViewContactLog,
  onRefreshData,
  onAddValidator,
}) => {
  const getContactLogsByValidator = (validatorId: string) => {
    return contactLogs
      .filter(log => log.validator_id === validatorId)
      .sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())
      .slice(0, 3);
  };

  const getNotesByValidator = (validatorId: string) => {
    return notes
      .filter(note => note.validator_id === validatorId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 2);
  };

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
      const result = await updateValidatorStage(validator.id, newStage);
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

  return (
    <AccordionItem value="validators" className="border-b">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 data-[state=open]:bg-gray-50">
        <div className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          <span className="font-medium">Validators</span>
          <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
            {validators.length}
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
                {validators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      No validators found
                    </TableCell>
                  </TableRow>
                ) : (
                  validators.map((validator) => {
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
                              <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Discovery")}>
                                Discovery
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Discussion")}>
                                Discussion
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Planning")}>
                                Planning
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Implementation")}>
                                Implementation
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Relationship")}>
                                Relationship
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateValidatorStage(validator, "Dormant")}>
                                Dormant
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ValidatorsTableSection;
