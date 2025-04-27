
import { useState, useEffect } from "react";
import { TaoValidator } from "@/services/taoValidatorService";

export function useKanbanState(validators: TaoValidator[]) {
  const [localValidators, setLocalValidators] = useState<TaoValidator[]>([]);

  // Initialize local state from props
  useEffect(() => {
    setLocalValidators(validators);
  }, [validators]);

  return {
    localValidators,
    setLocalValidators
  };
}
