
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
import { Users, Plus, Mail, MessageCircle } from "lucide-react";
import { TaoValidator, TaoContactLog, TaoNote, deleteValidator, updateValidatorStage, updateValidator } from "@/services/taoValidatorService";
import { toast } from "sonner";
import { getStageColor } from "./crmUtils";
import { ValidatorActions } from "./components/ValidatorActions";
import { RecentContacts } from "./components/RecentContacts";
import { RecentNotes } from "./components/RecentNotes";
import { useValidatorData } from "./hooks/useValidatorData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onRefreshData,
}) => {
  const { getContactLogsByValidator, getNotesByValidator } = useValidatorData(contactLogs, notes);

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
                              {["Discovery", "Discussion", "Planning", "Implementation", "Relationship", "Dormant"].map((stage) => (
                                <DropdownMenuItem 
                                  key={stage}
                                  onClick={() => handleUpdateValidatorStage(validator, stage as TaoValidator["crm_stage"])}
                                >
                                  {stage}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className={`px-3 py-1 h-auto text-xs`}>
                                {validator.priority}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {["High", "Medium", "Low"].map((priority) => (
                                <DropdownMenuItem 
                                  key={priority}
                                  onClick={() => handleUpdateValidatorPriority(validator, priority as TaoValidator["priority"])}
                                >
                                  {priority}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <RecentContacts
                            contacts={recentContacts}
                            validator={validator}
                            onAddContact={onAddContactLog}
                          />
                        </TableCell>
                        <TableCell>
                          <RecentNotes
                            notes={recentNotes}
                            validator={validator}
                            onAddNote={onAddNote}
                          />
                        </TableCell>
                        <TableCell>
                          <ValidatorActions
                            validator={validator}
                            onEditValidator={onEditValidator}
                            onAddContactLog={onAddContactLog}
                            onAddNote={onAddNote}
                            onDeleteValidator={handleDeleteValidator}
                          />
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
