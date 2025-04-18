
import { useState, useEffect } from "react";
import { TaoValidator } from "@/services/taoValidatorService";

export const useKanbanState = (initialValidators: TaoValidator[]) => {
  const [localValidators, setLocalValidators] = useState<TaoValidator[]>([]);

  useEffect(() => {
    setLocalValidators(initialValidators);
  }, [initialValidators]);

  return {
    localValidators,
    setLocalValidators,
  };
};
