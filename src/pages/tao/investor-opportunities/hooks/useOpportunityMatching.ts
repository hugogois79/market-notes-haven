
import { useState, useEffect } from "react";
import { generateOpportunityMatches } from "../services/investorOpportunityService";
import { InvestmentPreference, OpportunityMatch } from "../types";

/**
 * Custom hook for opportunity matching functionality
 */
export function useOpportunityMatching(
  preferences: InvestmentPreference[]
) {
  const [selectedPreference, setSelectedPreference] = useState<InvestmentPreference | null>(null);
  const [matchedOpportunities, setMatchedOpportunities] = useState<OpportunityMatch[]>([]);

  // Update preference and generate matches whenever selected preference changes
  useEffect(() => {
    const generateMatches = async () => {
      if (selectedPreference) {
        try {
          const matches = await generateOpportunityMatches(selectedPreference);
          setMatchedOpportunities(matches);
        } catch (error) {
          console.error("Error generating matches:", error);
          setMatchedOpportunities([]);
        }
      } else {
        setMatchedOpportunities([]);
      }
    };

    generateMatches();
  }, [selectedPreference]);

  // Set the first preference as default if none selected and preferences are loaded
  useEffect(() => {
    if (!selectedPreference && preferences.length > 0) {
      setSelectedPreference(preferences[0]);
    }
  }, [preferences, selectedPreference]);

  return {
    selectedPreference,
    setSelectedPreference,
    matchedOpportunities
  };
}
