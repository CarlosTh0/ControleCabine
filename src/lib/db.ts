import { BoxData, ControlEntry } from '@/types';

const DB_NAME = 'controleCabineDB';
const DB_VERSION = 1;

class Database {
  private db: IDBDatabase | null = null;

  async init() {
    try {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('Erro ao abrir o banco de dados:', request.error);
          // Se não conseguir usar IndexedDB, vamos usar localStorage como fallback
          this.initializeWithLocalStorage();
          resolve();
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Cria store para boxes
          if (!db.objectStoreNames.contains('boxes')) {
            const boxStore = db.createObjectStore('boxes', { keyPath: 'id' });
            boxStore.createIndex('status', 'status');
            boxStore.createIndex('trip', 'trip');

            // Adiciona boxes iniciais
            const transaction = db.transaction(['boxes'], 'readwrite');
            const store = transaction.objectStore('boxes');
            
            // Cria 70 boxes iniciais
            Array.from({ length: 70 }, (_, i) => ({
              id: `${i + 1}`,
              trip: '',
              status: 'free',
              lastUpdate: new Date().toISOString()
            })).forEach(box => store.add(box));
          }

          // Cria store para entradas de controle
          if (!db.objectStoreNames.contains('control_entries')) {
            const entryStore = db.createObjectStore('control_entries', { keyPath: 'id', autoIncrement: true });
            entryStore.createIndex('date', 'date');
            entryStore.createIndex('trip', 'trip');
          }
        };
      });
    } catch (error) {
      console.error('Erro ao inicializar o banco de dados:', error);
      // Se algo der errado, usa localStorage como fallback
      this.initializeWithLocalStorage();
    }
  }

  private initializeWithLocalStorage() {
    console.log('Usando localStorage como fallback');
    // Verifica se já existem dados no localStorage
    if (!localStorage.getItem('boxData')) {
      // Cria boxes iniciais
      const initialBoxes = Array.from({ length: 70 }, (_, i) => ({
        id: `${i + 1}`,
        trip: '',
        status: 'free',
        lastUpdate: new Date().toISOString()
      }));
      localStorage.setItem('boxData', JSON.stringify(initialBoxes));
    }
    
    if (!localStorage.getItem('tableEntries')) {
      localStorage.setItem('tableEntries', JSON.stringify([]));
    }
  }

  async getBoxes(): Promise<BoxData[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['boxes'], 'readonly');
      const store = transaction.objectStore('boxes');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateBox(id: string, status: string, trip?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['boxes'], 'readwrite');
      const store = transaction.objectStore('boxes');
      const request = store.put({
        id,
        status,
        trip,
        lastUpdate: new Date().toISOString()
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getEntries(): Promise<ControlEntry[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['control_entries'], 'readonly');
      const store = transaction.objectStore('control_entries');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Ordena por data e hora decrescente
        const entries = request.result.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });
        resolve(entries);
      };
    });
  }

  async addEntry(entry: Omit<ControlEntry, 'id'>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['control_entries'], 'readwrite');
      const store = transaction.objectStore('control_entries');
      const request = store.add({
        ...entry,
        createdAt: new Date().toISOString()
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearEntries(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['control_entries'], 'readwrite');
      const store = transaction.objectStore('control_entries');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

const db = new Database();

// Inicializa o banco de dados
db.init().catch(console.error);

export const getBoxes = () => db.getBoxes();
export const updateBox = (id: string, status: string, trip?: string) => db.updateBox(id, status, trip);
export const getEntries = () => db.getEntries();
export const addEntry = (entry: Omit<ControlEntry, 'id'>) => db.addEntry(entry);
export const clearEntries = () => db.clearEntries();

export default db; 