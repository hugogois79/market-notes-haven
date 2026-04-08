
import { useState } from "react";
import { TaoValidator, TaoContactLog, TaoNote } from "@/services/taoValidatorService";
import { TaoSubnet } from "@/services/taoSubnetService";
import { useNavigate } from "react-router-dom";

export function useValidatorManagementState(initialTab: string = "monday-crm") {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Dialogs state
  const [validatorFormOpen, setValidatorFormOpen] = useState(false);
  const [contactLogFormOpen, setContactLogFormOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected items for forms/dialogs
  const [selectedValidator, setSelectedValidator] = useState<TaoValidator>();
  const [selectedContactLog, setSelectedContactLog] = useState<TaoContactLog>();
  const [selectedNote, setSelectedNote] = useState<TaoNote>();
  const [selectedSubnet, setSelectedSubnet] = useState<TaoSubnet>();

  return {
    activeTab,
    setActiveTab,
    validatorFormOpen,
    setValidatorFormOpen,
    contactLogFormOpen,
    setContactLogFormOpen,
    noteFormOpen,
    setNoteFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedValidator,
    setSelectedValidator,
    selectedContactLog,
    setSelectedContactLog,
    selectedNote,
    setSelectedNote,
    selectedSubnet,
    setSelectedSubnet,
    navigate
  };
}
