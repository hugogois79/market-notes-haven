
import { useState, useCallback } from "react";

export function useAutoSave({
  autoSave,
  onSave,
}: {
  autoSave?: boolean;
  onSave?: () => void;
}) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleAutoSave = useCallback(() => {
    if (autoSave && onSave) {
      onSave();
      setLastSaved(new Date());
    }
  }, [autoSave, onSave]);

  const handleManualSave = useCallback(() => {
    if (onSave) {
      onSave();
      setLastSaved(new Date());
    }
  }, [onSave]);

  return {
    lastSaved,
    setLastSaved,
    handleAutoSave,
    handleManualSave
  };
}
