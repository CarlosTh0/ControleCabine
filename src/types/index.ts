export * from './box';
export * from './table';

export type BoxData = {
  id: string;
  status: 'free' | 'occupied' | 'blocked';
  trip: string;
  lastUpdate: string;
};

export type ControlEntry = {
  id?: string;
  date: string;
  time: string;
  trip: string;
  oldTrip?: string;
  preBox: string;
  boxInside: string;
  quantity?: string | number;
  shift?: string | number;
  cargoType?: string;
  region?: string;
  status?: string;
  manifestDate?: string;
};

export interface BackupConfig {
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  keepCount: number;
  lastBackup?: string;
  storageLocation: string;
  compression: boolean;
  notifyOnComplete: boolean;
  encryptBackup: boolean;
  scheduleTime?: string;
  excludedData?: string[];
  validateBeforeRestore: boolean;
  createBackupBeforeRestore: boolean;
} 