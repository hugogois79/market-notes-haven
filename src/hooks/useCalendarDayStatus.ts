import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CalendarDayStatus {
  id: string;
  user_id: string;
  date: string;
  beatriz_status: string | null;
  diana_status: string | null;
  is_holiday: boolean;
}

type CustodyStatus = 'comigo' | 'mae' | null;
type DianaStatus = 'comigo' | null;

export function useCalendarDayStatus(dateRange: { start: string; end: string }) {
  const queryClient = useQueryClient();

  const { data: dayStatuses = [] } = useQuery({
    queryKey: ["calendar-day-status", dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("calendar_day_status")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);

      if (error) throw error;
      return data as CalendarDayStatus[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      date, 
      beatriz_status, 
      diana_status, 
      is_holiday 
    }: { 
      date: string; 
      beatriz_status?: CustodyStatus; 
      diana_status?: DianaStatus; 
      is_holiday?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const existing = dayStatuses.find(s => s.date === date);

      if (existing) {
        const updates: Partial<CalendarDayStatus> = {};
        if (beatriz_status !== undefined) updates.beatriz_status = beatriz_status;
        if (diana_status !== undefined) updates.diana_status = diana_status;
        if (is_holiday !== undefined) updates.is_holiday = is_holiday;

        const { error } = await supabase
          .from("calendar_day_status")
          .update(updates)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("calendar_day_status")
          .insert({
            user_id: user.id,
            date,
            beatriz_status: beatriz_status ?? null,
            diana_status: diana_status ?? null,
            is_holiday: is_holiday ?? false,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-day-status"] });
    },
  });

  const getCustodyForDate = (dateStr: string): CustodyStatus => {
    const status = dayStatuses.find(s => s.date === dateStr);
    return (status?.beatriz_status as CustodyStatus) || null;
  };

  const getDianaForDate = (dateStr: string): DianaStatus => {
    const status = dayStatuses.find(s => s.date === dateStr);
    return (status?.diana_status as DianaStatus) || null;
  };

  const isHolidayDate = (dateStr: string): boolean => {
    const status = dayStatuses.find(s => s.date === dateStr);
    return status?.is_holiday ?? false;
  };

  const handleCustodyChange = (dateStr: string, status: CustodyStatus) => {
    updateStatusMutation.mutate({ date: dateStr, beatriz_status: status });
  };

  const handleDianaChange = (dateStr: string, status: DianaStatus) => {
    updateStatusMutation.mutate({ date: dateStr, diana_status: status });
  };

  const handleHolidayToggle = (dateStr: string) => {
    const current = isHolidayDate(dateStr);
    updateStatusMutation.mutate({ date: dateStr, is_holiday: !current });
  };

  return {
    dayStatuses,
    getCustodyForDate,
    getDianaForDate,
    isHolidayDate,
    handleCustodyChange,
    handleDianaChange,
    handleHolidayToggle,
    isUpdating: updateStatusMutation.isPending,
  };
}
