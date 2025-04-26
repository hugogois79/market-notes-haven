
import React from "react";
import KanbanBoard from "./KanbanBoard";
import { TaoValidator, TaoSubnet, TaoContactLog, TaoNote } from "@/services/taoValidatorService";

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
  expandedGroups,
  setExpandedGroups,
  validators,
  subnets,
  contactLogs,
  notes,
  validatorsBySubnet,
  validatorNames,
  subnetNames,
  onEditValidator,
  onAddValidator,
  onAddContactLog,
  onAddNote,
  onViewContactLog,
  onRefreshData,
  onViewSubnet,
}) => {
  return (
    <KanbanBoard 
      validators={validators}
      contactLogs={contactLogs}
      onEditValidator={onEditValidator}
      onAddValidator={onAddValidator}
      onAddContactLog={onAddContactLog}
      onAddNote={onAddNote}
      onRefreshData={onRefreshData}
    />
  );
};

export default CRMMainView;
