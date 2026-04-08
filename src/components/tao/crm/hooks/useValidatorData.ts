
import { TaoContactLog, TaoNote } from "@/services/taoValidatorService";

export const useValidatorData = (
  contactLogs: TaoContactLog[],
  notes: TaoNote[],
) => {
  const getContactLogsByValidator = (validatorId: string) => {
    return contactLogs
      .filter(log => log.validator_id === validatorId)
      .sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())
      .slice(0, 3);
  };

  const getNotesByValidator = (validatorId: string) => {
    return notes
      .filter(note => note.validator_id === validatorId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 2);
  };

  return {
    getContactLogsByValidator,
    getNotesByValidator,
  };
};
