
export interface TaoContactLog {
  id: string;
  validator_id: string;
  subnet_id: number | null;
  contact_date: string;
  method: 'Email' | 'Telegram' | 'Call' | 'DM' | 'Zoom' | 'In Person' | 'Meeting' | 'Discord' | 'Other';
  summary: string | null;
  next_steps: string | null;
  linked_note_id: string | null;
  created_at: string;
  updated_at: string;
  attachment_url: string | null;
}
