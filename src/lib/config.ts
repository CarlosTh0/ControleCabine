import { openDB, IDBPDatabase, DBSchema } from 'idb';

interface ConfigEntry {
  key: string;
  value: SystemConfig;
}

interface ConfigDB extends DBSchema {
  config: {
    key: string;
    value: ConfigEntry;
    indexes: { 'by-key': string };
  };
}

interface Shift {
  name: string;
  start: string;
  end: string;
  isActive: boolean;
}

export interface SystemConfig {
  general: {
    companyName: string;
    maxBoxes: number;
    shifts: Shift[];
    autoSave: boolean;
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    alerts: {
      boxOccupied: boolean;
      tripComplete: boolean;
      errors: boolean;
    };
  };
  backup: {
    autoBackup: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    keepCount: number;
    storageLocation: string;
    compression: boolean;
    notifyOnComplete: boolean;
    encryptBackup: boolean;
    scheduleTime: string;
    excludedData: string[];
    lastBackup: string | null;
    validateBeforeRestore: boolean;
    createBackupBeforeRestore: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    density: 'compact' | 'comfortable' | 'spacious';
    fontSize: 'small' | 'medium' | 'large';
    accentColor: string;
  };
}

export const DEFAULT_CONFIG: SystemConfig = {
  general: {
    companyName: 'ControleCabine',
    maxBoxes: 20,
    shifts: [
      {
        name: 'Primeiro Turno',
        start: '06:00',
        end: '14:00',
        isActive: true
      },
      {
        name: 'Segundo Turno',
        start: '14:00',
        end: '22:00',
        isActive: true
      },
      {
        name: 'Terceiro Turno',
        start: '22:00',
        end: '06:00',
        isActive: true
      }
    ],
    autoSave: true
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    alerts: {
      boxOccupied: true,
      tripComplete: true,
      errors: true
    }
  },
  backup: {
    autoBackup: true,
    frequency: 'daily',
    keepCount: 7,
    storageLocation: './backups',
    compression: true,
    notifyOnComplete: true,
    encryptBackup: false,
    scheduleTime: '23:00',
    excludedData: ['Arquivos Temporários'],
    lastBackup: null,
    validateBeforeRestore: true,
    createBackupBeforeRestore: true
  },
  appearance: {
    theme: 'light',
    density: 'comfortable',
    fontSize: 'medium',
    accentColor: '#0066cc'
  }
};

const DB_NAME = 'controleCabine';
const STORE_NAME = 'config';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<ConfigDB>> | null = null;

async function getDB() {
  if (!dbPromise) {
    console.log('Criando nova conexão com o banco de dados...');
    dbPromise = openDB<ConfigDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Atualizando banco de dados de v${oldVersion} para v${newVersion}`);
        
        // Se o store existir, deleta
        if (db.objectStoreNames.contains(STORE_NAME)) {
          console.log('Deletando store existente...');
          db.deleteObjectStore(STORE_NAME);
        }
        
        // Cria o store com keyPath
        console.log('Criando novo store...');
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'key'
        });
        
        // Cria um índice para busca por chave
        store.createIndex('by-key', 'key', { unique: true });
        
        // Adiciona configuração padrão diretamente no store
        console.log('Adicionando configuração padrão...');
        store.put({
          key: 'systemConfig',
          value: DEFAULT_CONFIG
        });
      },
      blocked(currentVersion, blockedVersion, event) {
        console.log(`Banco bloqueado. Versão atual: ${currentVersion}, Versão bloqueada: ${blockedVersion}`);
        // Fecha todas as conexões antigas
        const request = indexedDB.open(DB_NAME);
        request.onsuccess = () => {
          const db = request.result;
          db.close();
        };
      },
      blocking(currentVersion, blockedVersion, event) {
        console.log(`Bloqueando versão antiga. Versão atual: ${currentVersion}, Versão bloqueada: ${blockedVersion}`);
        // Fecha a conexão atual para permitir o upgrade
        dbPromise = null;
      },
      terminated() {
        console.log('Conexão com o banco de dados foi terminada');
        dbPromise = null;
      }
    });
  }
  return dbPromise;
}

export async function initConfig() {
  try {
    console.log('Iniciando configuração do banco de dados...');
    const db = await getDB();
    console.log('Banco de dados obtido, verificando configuração...');
    
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const configEntry = await store.get('systemConfig') as ConfigEntry | undefined;
    
    if (!configEntry) {
      console.log('Nenhuma configuração encontrada, salvando configuração padrão...');
      const newEntry: ConfigEntry = {
        key: 'systemConfig',
        value: DEFAULT_CONFIG
      };
      await store.put(newEntry);
    } else {
      console.log('Configuração existente encontrada');
    }

    await tx.done;
    console.log('Configuração inicializada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar configurações:', error);
    throw error;
  }
}

export async function getConfig(): Promise<SystemConfig> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const configEntry = await store.get('systemConfig') as ConfigEntry | undefined;
    await tx.done;
    
    const config = configEntry?.value || DEFAULT_CONFIG;
    if (!Array.isArray(config.general.shifts)) {
      config.general.shifts = DEFAULT_CONFIG.general.shifts;
    }
    
    return config;
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    return DEFAULT_CONFIG;
  }
}

export async function updateConfig(newConfig: Partial<SystemConfig>): Promise<SystemConfig> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const configEntry = await store.get('systemConfig') as ConfigEntry | undefined;
    const currentConfig = configEntry?.value || DEFAULT_CONFIG;
    
    const updatedConfig = {
      ...currentConfig,
      ...newConfig,
      general: { ...currentConfig.general, ...newConfig.general },
      notifications: { 
        ...currentConfig.notifications, 
        ...newConfig.notifications,
        alerts: { ...currentConfig.notifications.alerts, ...newConfig.notifications?.alerts }
      },
      backup: { ...currentConfig.backup, ...newConfig.backup },
      appearance: { ...currentConfig.appearance, ...newConfig.appearance }
    };

    const newEntry: ConfigEntry = {
      key: 'systemConfig',
      value: updatedConfig
    };
    await store.put(newEntry);
    
    await tx.done;
    return updatedConfig;
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    throw error;
  }
}

export async function resetConfig(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const newEntry: ConfigEntry = {
      key: 'systemConfig',
      value: DEFAULT_CONFIG
    };
    await store.put(newEntry);
    await tx.done;
  } catch (error) {
    console.error('Erro ao resetar configurações:', error);
    throw error;
  }
} 