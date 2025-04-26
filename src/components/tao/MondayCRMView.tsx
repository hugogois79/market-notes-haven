
import React, { useState, useEffect } from "react";
import { TaoValidator, TaoSubnet, TaoContactLog, TaoNote } from "@/services/taoValidatorService";
import CRMViewHeader from "./crm/CRMViewHeader";
import CRMMainView from "./crm/CRMMainView";
import { useFilteredCRMData } from "@/hooks/useFilteredCRMData";
import KanbanBoard from "./crm/KanbanBoard";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();
  const initialView = location.state?.initialView === "kanban" ? "kanban" : "main";
  const [selectedView, setSelectedView] = useState<"main" | "kanban">(initialView);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["validators", "subnets"]);
  
  const { searchTerm, setSearchTerm, filteredValidators, filteredSubnets } = useFilteredCRMData(validators, subnets);

  // Update view if navigation state changes
  useEffect(() => {
    if (location.state?.initialView === "kanban") {
      setSelectedView("kanban");
    }
  }, [location.state]);

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
        <KanbanBoard 
          validators={filteredValidators} 
          contactLogs={contactLogs}
          onEditValidator={onEditValidator}
          onAddValidator={onAddValidator}
          onAddContactLog={onAddContactLog}
          onAddNote={onAddNote}
          onRefreshData={onRefreshData}
        />
      )}
    </div>
  );
};

export default MondayCRMView;
