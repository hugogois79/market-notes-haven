
import { useState } from "react";
import { TaoValidator, TaoSubnet } from "@/services/taoValidatorService";

export function useFilteredCRMData(
  validators: TaoValidator[],
  subnets: TaoSubnet[]
) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredValidators = validators.filter(validator => 
    validator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (validator.email && validator.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (validator.telegram && validator.telegram.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSubnets = subnets.filter(subnet => 
    subnet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subnet.description && subnet.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return {
    searchTerm,
    setSearchTerm,
    filteredValidators,
    filteredSubnets
  };
}
