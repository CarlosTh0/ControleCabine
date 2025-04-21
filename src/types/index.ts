export * from './box';
export * from './table';

export type BoxData = {
  id: string;
  status: 'free' | 'occupied' | 'blocked';
  trip: string;
  lastUpdate: string;
};

export type ControlEntry = {
  id: string;
  date: string;
  time: string;
  preBox: string;
  boxInside: string;
  boxOutside: string;
  driver: string;
  plate: string;
  destination: string;
  observation: string;
}; 