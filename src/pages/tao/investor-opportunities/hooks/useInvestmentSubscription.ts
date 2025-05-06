
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to real-time updates for investments
 */
export function useInvestmentSubscription(
  refetchInvestments: () => void,
  refetchAnalytics: () => void
) {
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments'
        },
        () => {
          // Refetch investments when they change
          refetchInvestments();
          refetchAnalytics();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchInvestments, refetchAnalytics]);
}
