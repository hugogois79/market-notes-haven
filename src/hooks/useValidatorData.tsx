
import { useQuery } from "@tanstack/react-query";
import {
  fetchValidators,
  fetchContactLogs,
  fetchTaoNotes,
  fetchValidatorsBySubnet,
  TaoValidator,
  TaoContactLog,
  TaoNote,
} from "@/services/taoValidatorService";
import { fetchTaoSubnets, TaoSubnet } from "@/services/taoSubnetService";
import { useState, useEffect } from "react";
import { useNotes } from "@/contexts/NotesContext";
import { adaptArrayToSubnetTypes } from "@/utils/subnetTypeAdapter";
import { TaoSubnet as TaoSubnetTypes } from "@/services/subnets/types";

export function useValidatorData() {
  const { refetch: refetchAppNotes } = useNotes();
  const [validatorsBySubnet, setValidatorsBySubnet] = useState<Record<number, string[]>>({});

  // Fetch validators data
  const {
    data: validators = [],
    isLoading: isLoadingValidators,
    refetch: refetchValidators,
  } = useQuery({
    queryKey: ["tao-validators"],
    queryFn: fetchValidators,
  });

  // Fetch subnets data
  const {
    data: rawSubnets = [],
    isLoading: isLoadingSubnets,
    refetch: refetchSubnets,
  } = useQuery({
    queryKey: ["tao-subnets"],
    queryFn: fetchTaoSubnets,
  });

  // Convert the subnets to the correct type
  const subnets: TaoSubnetTypes[] = adaptArrayToSubnetTypes(rawSubnets);

  // Fetch contact logs
  const {
    data: contactLogs = [],
    isLoading: isLoadingContactLogs,
    refetch: refetchContactLogs,
  } = useQuery({
    queryKey: ["tao-contact-logs"],
    queryFn: fetchContactLogs,
  });

  // Fetch notes
  const {
    data: notes = [],
    isLoading: isLoadingNotes,
    refetch: refetchNotes,
  } = useQuery({
    queryKey: ["tao-notes"],
    queryFn: fetchTaoNotes,
  });

  // Create mappings for subnet-validator relationships
  useEffect(() => {
    const fetchSubnetValidators = async () => {
      const subnetValidatorMap: Record<number, string[]> = {};
      
      await Promise.all(
        subnets.map(async (subnet) => {
          const subnetId = subnet.id;
          const validatorIds = await fetchValidatorsBySubnet(subnetId);
          subnetValidatorMap[subnetId] = validatorIds;
        })
      );
      
      setValidatorsBySubnet(subnetValidatorMap);
    };

    if (subnets.length > 0) {
      fetchSubnetValidators();
    }
  }, [subnets]);

  // Create a mapping of validator IDs to names for easier reference
  const validatorNames = validators.reduce<Record<string, string>>(
    (acc, validator) => {
      acc[validator.id] = validator.name;
      return acc;
    },
    {}
  );

  // Create a mapping of subnet IDs to names for easier reference
  const subnetNames = subnets.reduce<Record<number, string>>(
    (acc, subnet) => {
      acc[subnet.id] = subnet.name;
      return acc;
    },
    {}
  );

  // Function to refresh all data
  const refreshAllData = () => {
    refetchValidators();
    refetchContactLogs();
    refetchNotes();
    refetchSubnets();
    refetchAppNotes();
  };

  // Loading state for the whole page
  const isLoading =
    isLoadingValidators || isLoadingSubnets || isLoadingContactLogs || isLoadingNotes;

  return {
    validators,
    subnets,
    contactLogs,
    notes,
    validatorsBySubnet,
    validatorNames,
    subnetNames,
    isLoading,
    refetchValidators,
    refetchContactLogs,
    refetchNotes,
    refetchSubnets,
    refreshAllData
  };
}
