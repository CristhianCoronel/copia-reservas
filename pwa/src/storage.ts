type StorageMode = 'localStorage' | 'sessionStorage' | 'memory';

// Cambia esta variable para controlar dónde se guardan los datos de sesión durante el desarrollo
let STORAGE_MODE: StorageMode = 'memory'; // Opciones: 'localStorage', 'sessionStorage', 'memory'

const memoryStorage = new Map<string, string>();

export const storage = {
  getItem: (key: string): string | null => {
    if (STORAGE_MODE === 'localStorage') return localStorage.getItem(key);
    if (STORAGE_MODE === 'sessionStorage') return sessionStorage.getItem(key);
    return memoryStorage.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    if (STORAGE_MODE === 'localStorage') {
      localStorage.setItem(key, value);
    } else if (STORAGE_MODE === 'sessionStorage') {
      sessionStorage.setItem(key, value);
    } else {
      memoryStorage.set(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (STORAGE_MODE === 'localStorage') {
      localStorage.removeItem(key);
    } else if (STORAGE_MODE === 'sessionStorage') {
      sessionStorage.removeItem(key);
    } else {
      memoryStorage.delete(key);
    }
  }
};
