export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  cmc_id?: number;
  coingecko_id?: string;
  logo_url?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  attachment_url?: string;
}
