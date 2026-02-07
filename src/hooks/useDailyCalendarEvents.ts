import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DailyCalendarEvent {
  id: string;
  date: string;
  title: string | null;
  category: string | null;
  period: string | null;
  notes: string | null;
  source: string;
  google_event_id: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
}

export function useDailyCalendarEvents(date: string, enabled: boolean = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["daily-calendar-events", date, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, date, title, category, period, notes, source, google_event_id, start_time, end_time, all_day")
        .eq("date", date)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching daily events:", error);
        throw error;
      }

      return (data || []) as DailyCalendarEvent[];
    },
    enabled: enabled && !!user,
  });
}
