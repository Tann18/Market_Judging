export type RoomStatus = 'LIVE' | 'PAUSED' | 'LOCKED';

export interface Company {
  id: string;
  name: string;
  ticker: string;
  price: number;
  startingPrice: number;
  history: number[];
}

export interface Room {
  id: number; // 1 - 4
  status: RoomStatus;
  companyAId: string;
  companyBId: string;
  increment: number; // default 2
}

export interface Judge {
  id: string;
  roomNumber: number; // 1 - 4
  judgeSlot: number; // 1 - 3
  pin: string; // unique 4-digit PIN
  name: string;
}

export interface VoteLog {
  id: string;
  timestamp: number;
  roomNumber: number;
  judgeSlot: number;
  companyTicker: string;
  delta: number;
  newPrice: number;
}

export interface MarketState {
  companies: Company[];
  rooms: Room[];
  judges: Judge[];
  voteLogs: VoteLog[];
  lastUpdated: number;
}
