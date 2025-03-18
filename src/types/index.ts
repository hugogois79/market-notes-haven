
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
  description?: string;
  industry?: string;
  tags: string[];
  current_price?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Tag {
  id: string;
  name: string;
}

export interface TradeInfo {
  tokenId?: string;
  quantity?: number;
  entryPrice?: number;
  targetPrice?: number;
  stopPrice?: number;
}

export interface TradingSettlementNote {
  id: string;
  noteId: string;
  tradeDate: Date;
  settlementDate?: Date;
  assetSymbol: string;
  quantity: number;
  price: number;
  tradeType: 'buy' | 'sell' | 'short' | 'cover';
  fees?: number;
  pnl?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  tokens?: Token[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
  attachment_url?: string;
  tradeInfo?: TradeInfo;
  hasConclusion?: boolean;
  tradingSettlementNotes?: TradingSettlementNote[];
}
