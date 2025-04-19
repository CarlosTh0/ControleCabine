export type BoxStatus = 'blocked' | 'free' | 'occupied';

export interface BoxData {
  id: string;
  trip: string;
  status: BoxStatus;
  lastUpdate: string;
}

export interface ControlEntry {
  date: string;
  trip: string;
  time: string;
  oldTrip: string;
  preBox: string;
  boxInside: string;
  quantity: number | string;
  shift: number | string;
  cargoType: string;
  region: string;
  status: string;
  manifestDate: string;
} 