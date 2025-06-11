
import { useState, useCallback } from "react";

export function useAutoSave({
  onSave,
}: {
  autoSave?: boolean;
  onSave?: () => void;
}) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Remove auto-save functionality - only manual save
  const handleManualSave = useCallback(() => {
    if (onSave) {
      console.log("Manual save triggered");
      onSave();
      setLastSaved(new Date());
    }
  }, [onSave]);

  return {
    lastSaved,
    setLastSaved,
    handleManualSave
  };
}
