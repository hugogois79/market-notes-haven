
import { useState, useEffect } from "react";
import { Note, TradeInfo } from "@/types";

interface UseBasicNoteFieldsProps {
  initialTitle: string;
  initialCategory: string;
  initialTradeInfo?: TradeInfo;
  initialSummary?: string;
  initialHasConclusion?: boolean;
}

export const useBasicNoteFields = (currentNote: Note) => {
  const [localTitle, setLocalTitle] = useState(currentNote.title || "");
  const [localCategory, setLocalCategory] = useState(currentNote.category || "General");
  const [localTradeInfo, setLocalTradeInfo] = useState<TradeInfo | undefined>(currentNote.tradeInfo);
  const [hasConclusion, setHasConclusion] = useState(currentNote.hasConclusion ?? true);
  const [localProjectId, setLocalProjectId] = useState<string | null>(currentNote.project_id || null);
  const [summaryState, setSummaryState] = useState({
    summary: currentNote.summary || "",
    hasConclusion: currentNote.hasConclusion ?? true
  });

  // Update local state when currentNote changes (only sync when note ID changes to avoid overwriting unsaved changes)
  useEffect(() => {
    console.log("useBasicNoteFields: Syncing with database values for note:", currentNote.id);
    setLocalTitle(currentNote.title || "");
    setLocalCategory(currentNote.category || "General");
    setLocalTradeInfo(currentNote.tradeInfo);
    setHasConclusion(currentNote.hasConclusion ?? true);
    setLocalProjectId(currentNote.project_id || null);
    
    // Update summary state
    setSummaryState({
      summary: currentNote.summary || "",
      hasConclusion: currentNote.hasConclusion ?? true
    });
  }, [currentNote.id]); // Only sync when loading a different note

  const handleTitleChange = (title: string) => {
    console.log("useBasicNoteFields: Title change (local only):", title);
    setLocalTitle(title);
    return title;
  };

  const handleCategoryChange = (category: string) => {
    console.log("useBasicNoteFields: Category change (local only):", category);
    setLocalCategory(category);
    return category;
  };

  const handleTradeInfoChange = (tradeInfo: TradeInfo) => {
    setLocalTradeInfo(tradeInfo);
  };

  const handleSummaryGenerated = (summary: string, conclusion?: boolean) => {
    const newHasConclusion = conclusion ?? true;
    setHasConclusion(newHasConclusion);
    setSummaryState({
      summary,
      hasConclusion: newHasConclusion
    });
    // Return the values so the caller can save them if needed
    return { summary, hasConclusion: newHasConclusion };
  };

  const handleProjectChange = (projectId: string | null) => {
    console.log("useBasicNoteFields: Project change:", projectId);
    setLocalProjectId(projectId);
    return projectId;
  };

  return {
    localTitle,
    localCategory,
    localTradeInfo,
    hasConclusion,
    summaryState,
    localProjectId,
    handleTitleChange,
    handleCategoryChange,
    handleTradeInfoChange,
    handleSummaryGenerated,
    handleProjectChange
  };
};
