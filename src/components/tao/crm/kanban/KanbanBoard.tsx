
import React from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { TaoValidator, TaoContactLog } from "@/services/taoValidatorService";
import { crmStages } from "../crmUtils";
import { useKanbanState } from "@/hooks/useKanbanState";
import { useKanbanDragAndDrop } from "./hooks/useKanbanDragAndDrop";
import { KanbanGrid } from "./components/KanbanGrid";

interface KanbanBoardProps {
  validators: TaoValidator[];
  contactLogs: TaoContactLog[];
  onEditValidator: (validator: TaoValidator) => void;
  onAddValidator: () => void;
  onAddContactLog: (validator?: TaoValidator) => void;
  onAddNote: (validator?: TaoValidator) => void;
  onRefreshData: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  validators,
  contactLogs,
  onEditValidator,
  onAddValidator,
  onAddContactLog,
  onAddNote,
  onRefreshData,
}) => {
  const { localValidators, setLocalValidators } = useKanbanState(validators);
  const { handleDragEnd } = useKanbanDragAndDrop({
    localValidators,
    setLocalValidators,
    onRefreshData,
  });

  const getRecentContactLogs = (validatorId: string) => {
    return contactLogs
      .filter(log => log.validator_id === validatorId)
      .sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())
      .slice(0, 1);
  };

  // Group validators by their CRM stage
  const validatorsByStage = crmStages.reduce<Record<string, TaoValidator[]>>((acc, stage) => {
    acc[stage] = localValidators.filter(v => v.crm_stage === stage);
    return acc;
  }, {} as Record<string, TaoValidator[]>);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <KanbanGrid
        validatorsByStage={validatorsByStage}
        contactLogs={contactLogs}
        onEditValidator={onEditValidator}
        onAddContactLog={onAddContactLog}
        onAddNote={onAddNote}
        onAddValidator={onAddValidator}
        getRecentContactLogs={getRecentContactLogs}
      />
    </DragDropContext>
  );
};

export default KanbanBoard;
