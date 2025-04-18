
import React, { useState } from "react";
import { TaoValidator, TaoSubnet, TaoContactLog, TaoNote } from "@/services/taoValidatorService";
import CRMViewHeader from "./crm/CRMViewHeader";
import CRMMainView from "./crm/CRMMainView";
import { useFilteredCRMData } from "@/hooks/useFilteredCRMData";
import {
  Mail,
  MessageCircle,
  Clock,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { getStageColor, getPriorityColor } from "./crm/crmUtils";
import { updateValidatorStage, updateValidator } from "@/services/taoValidatorService";
import { toast } from "sonner";

interface MondayCRMViewProps {
  validators: TaoValidator[];
  subnets: TaoSubnet[];
  contactLogs: TaoContactLog[];
  notes: TaoNote[];
  validatorsBySubnet: Record<number, string[]>;
  validatorNames: Record<string, string>;
  subnetNames: Record<number, string>;
  onViewSubnet: (subnet: TaoSubnet) => void;
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
  onViewSubnet,
  onAddValidator,
  onEditValidator,
  onAddContactLog,
  onAddNote,
  onViewContactLog,
  onRefreshData,
}) => {
  const [selectedView, setSelectedView] = useState<"main" | "kanban">("main");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["validators", "subnets"]);
  
  const { searchTerm, setSearchTerm, filteredValidators, filteredSubnets } = useFilteredCRMData(validators, subnets);

  const getContactLogsByValidator = (validatorId: string) => {
    return contactLogs.filter(log => log.validator_id === validatorId)
      .sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())
      .slice(0, 3); // Show only the most recent 3
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

  const renderKanbanView = () => {
    const validatorsByStage = {
      "Prospect": filteredValidators.filter(v => v.crm_stage === "Prospect"),
      "Contacted": filteredValidators.filter(v => v.crm_stage === "Contacted"),
      "Follow-up": filteredValidators.filter(v => v.crm_stage === "Follow-up"),
      "Negotiation": filteredValidators.filter(v => v.crm_stage === "Negotiation"),
      "Active": filteredValidators.filter(v => v.crm_stage === "Active"),
      "Inactive": filteredValidators.filter(v => v.crm_stage === "Inactive")
    };

    return (
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
    );
  };

  return (
    <div className="space-y-6">
      <CRMViewHeader
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddValidator={onAddValidator}
      />

      {selectedView === "main" ? (
        <CRMMainView
          expandedGroups={expandedGroups}
          setExpandedGroups={setExpandedGroups}
          validators={filteredValidators}
          subnets={filteredSubnets}
          contactLogs={contactLogs}
          notes={notes}
          validatorsBySubnet={validatorsBySubnet}
          validatorNames={validatorNames}
          subnetNames={subnetNames}
          onEditValidator={onEditValidator}
          onAddContactLog={onAddContactLog}
          onAddNote={onAddNote}
          onViewContactLog={onViewContactLog}
          onRefreshData={onRefreshData}
          onAddValidator={onAddValidator}
          onViewSubnet={onViewSubnet}
        />
      ) : (
        renderKanbanView()
      )}
    </div>
  );
};

export default MondayCRMView;
