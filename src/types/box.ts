export type BoxStatus = 'free' | 'occupied' | 'blocked';

export interface Box {
  id: string;
  status: BoxStatus;
  trip: string;
  lastUpdate: string;
} 