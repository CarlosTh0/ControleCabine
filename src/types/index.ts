export type BoxStatus = 'free' | 'occupied' | 'blocked';

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
  quantity: string;
  shift: string;
  cargoType: string;
  region: string;
  status: string;
  manifestDate: string;
} 