
import React from "react";
import { Accordion } from "@/components/ui/accordion";
import ValidatorsTableSection from "./ValidatorsTableSection";
import SubnetsTableSection from "./SubnetsTableSection";
import { TaoValidator, TaoSubnet, TaoContactLog, TaoNote } from "@/services/taoValidatorService";

interface CRMMainViewProps {
  expandedGroups: string[];
  setExpandedGroups: (groups: string[]) => void;
  validators: TaoValidator[];
  subnets: TaoSubnet[];
  contactLogs: TaoContactLog[];
  notes: TaoNote[];
  validatorsBySubnet: Record<number, string[]>;
  validatorNames: Record<string, string>;
  subnetNames: Record<number, string>;
  onEditValidator: (validator: TaoValidator) => void;
  onAddContactLog: (validator?: TaoValidator) => void;
  onAddNote: (validator?: TaoValidator, subnet?: TaoSubnet) => void;
  onViewContactLog: (log: TaoContactLog) => void;
  onRefreshData: () => void;
  onAddValidator: () => void;
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
  onAddContactLog,
  onAddNote,
  onViewContactLog,
  onRefreshData,
  onAddValidator,
}) => {
  return (
    <div className="space-y-6">
      <Accordion
        type="multiple"
        value={expandedGroups}
        onValueChange={setExpandedGroups}
        className="border rounded-md"
      >
        <ValidatorsTableSection
          validators={validators}
          contactLogs={contactLogs}
          notes={notes}
          onEditValidator={onEditValidator}
          onAddContactLog={onAddContactLog}
          onAddNote={onAddNote}
          onViewContactLog={onViewContactLog}
          onRefreshData={onRefreshData}
          onAddValidator={onAddValidator}
        />
        <SubnetsTableSection
          subnets={subnets}
          validatorsBySubnet={validatorsBySubnet}
          validatorNames={validatorNames}
          validators={validators}
          onAddNote={onAddNote}
        />
      </Accordion>
    </div>
  );
};

export default CRMMainView;
