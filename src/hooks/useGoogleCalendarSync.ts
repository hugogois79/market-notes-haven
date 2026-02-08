/**
 * Hook to sync calendar events with Google Calendar via n8n webhook.
 * 
 * The n8n webhook at https://n8n.gvvcapital.com/webhook/calendar-sync
 * handles create/update/delete operations on Google Calendar.
 * 
 * This sync is fire-and-forget: failures are logged but don't block the UI.
 */

const N8N_WEBHOOK_URL = "https://n8n.gvvcapital.com/webhook/calendar-sync";

interface CalendarEventPayload {
  action: "create" | "update" | "delete";
  event_id: string;
  google_event_id?: string | null;
  title?: string | null;
  date?: string;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
}

async function syncToGoogleCalendar(payload: CalendarEventPayload): Promise<{ success: boolean; google_event_id?: string }> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn("[Google Calendar Sync] Webhook returned error:", response.status);
      return { success: false };
    }

    const data = await response.json();
    return { success: true, google_event_id: data.google_event_id };
  } catch (error) {
    // Sync failures are non-critical - log and continue
    console.warn("[Google Calendar Sync] Failed to sync:", error);
    return { success: false };
  }
}

export function useGoogleCalendarSync() {
  const syncCreate = async (
    eventId: string,
    title: string | null,
    date: string,
    notes?: string | null,
    startTime?: string | null,
    endTime?: string | null
  ) => {
    return syncToGoogleCalendar({
      action: "create",
      event_id: eventId,
      title,
      date,
      start_time: startTime || `${date}T09:00:00`,
      end_time: endTime || `${date}T10:00:00`,
      notes,
    });
  };

  const syncUpdate = async (
    eventId: string,
    googleEventId: string | null,
    title: string | null,
    date: string,
    notes?: string | null,
    startTime?: string | null,
    endTime?: string | null
  ) => {
    if (!googleEventId) {
      // If no google_event_id, treat as create
      return syncCreate(eventId, title, date, notes, startTime, endTime);
    }
    return syncToGoogleCalendar({
      action: "update",
      event_id: eventId,
      google_event_id: googleEventId,
      title,
      date,
      start_time: startTime,
      end_time: endTime,
      notes,
    });
  };

  const syncDelete = async (eventId: string, googleEventId: string | null) => {
    if (!googleEventId) return { success: true }; // Nothing to delete on Google side
    return syncToGoogleCalendar({
      action: "delete",
      event_id: eventId,
      google_event_id: googleEventId,
    });
  };

  return { syncCreate, syncUpdate, syncDelete };
}
