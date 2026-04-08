
import React from "react";
import { TaoValidator, TaoSubnet, TaoContactLog, TaoNote } from "@/services/taoValidatorService";
import KanbanBoard from "./kanban/KanbanBoard";

interface CRMMainViewProps {
  expandedGroups: string[];
  setExpandedGroups: React.Dispatch<React.SetStateAction<string[]>>;
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
  onViewSubnet: (subnet: TaoSubnet) => void;
}

const CRMMainView: React.FC<CRMMainViewProps> = ({
  validators,
  contactLogs,
  onEditValidator,
  onAddValidator,
  onAddContactLog,
  onAddNote,
  onRefreshData,
}) => {
  return (
    <div className="overflow-x-auto">
      <KanbanBoard 
        validators={validators}
        contactLogs={contactLogs}
        onEditValidator={onEditValidator}
        onAddValidator={onAddValidator}
        onAddContactLog={onAddContactLog}
        onAddNote={onAddNote}
        onRefreshData={onRefreshData}
      />
    </div>
  );
};

export default CRMMainView;
