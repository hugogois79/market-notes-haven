
export interface TaoNote {
  id: string;
  title: string;
  content: string | null;
  validator_id: string | null;
  subnet_id: number | null;
  created_at: string;
  updated_at: string;
}
