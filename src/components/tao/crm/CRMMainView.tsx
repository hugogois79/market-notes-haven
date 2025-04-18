import React from "react";
import KanbanBoard from "./kanban/KanbanBoard";

interface CRMMainViewProps {
  
}

const CRMMainView: React.FC<CRMMainViewProps> = ({
  
}) => {
  return (
    <KanbanBoard 
      validators={[]}
      contactLogs={[]}
      onEditValidator={() => {}}
      onAddValidator={() => {}}
      onAddContactLog={() => {}}
      onAddNote={() => {}}
      onRefreshData={() => {}}
    />
  );
};

export default CRMMainView;
