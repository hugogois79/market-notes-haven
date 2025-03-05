
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  logo_url?: string;
  description?: string;
  industry?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface Trader {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  contact_info?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPortfolio {
  id: string;
  portfolio_id: string;
  token_id: string;
  created_at: Date;
}

export interface TokenTrader {
  id: string;
  trader_id: string;
  token_id: string;
  created_at: Date;
}

export interface TokenNote {
  id: string;
  note_id: string;
  token_id: string;
  created_at: Date;
}

export interface TagNote {
  id: string;
  note_id: string;
  tag_id: string;
  created_at: Date;
}
