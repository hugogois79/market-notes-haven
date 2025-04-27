
import React from "react";
import { TaoValidator, TaoContactLog } from "@/services/taoValidatorService";
import { crmStages } from "../../crmUtils";
import KanbanColumn from "../KanbanColumn";

interface KanbanGridProps {
  validatorsByStage: Record<string, TaoValidator[]>;
  contactLogs: TaoContactLog[];
  onEditValidator: (validator: TaoValidator) => void;
  onAddContactLog: (validator?: TaoValidator) => void;
  onAddNote: (validator?: TaoValidator) => void;
  onAddValidator: () => void;
  getRecentContactLogs: (validatorId: string) => TaoContactLog[];
}

export const KanbanGrid: React.FC<KanbanGridProps> = ({
  validatorsByStage,
  contactLogs,
  onEditValidator,
  onAddContactLog,
  onAddNote,
  onAddValidator,
  getRecentContactLogs,
}) => {
  return (
    <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-6 min-w-[1200px]">
      {crmStages.map((stage) => (
        <KanbanColumn
          key={stage}
          stage={stage}
          validators={validatorsByStage[stage] || []}
          contactLogs={contactLogs}
          onEditValidator={onEditValidator}
          onAddContactLog={onAddContactLog}
          onAddNote={onAddNote}
          onAddValidator={onAddValidator}
          getRecentContactLogs={getRecentContactLogs}
        />
      ))}
    </div>
  );
};
