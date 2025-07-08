import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'gxplorer_connections';
const SECRET_KEY = 'gxplorer_super_secret_key'; // In production, prompt user or use a more secure method

export interface Connection {
  id: string;
  name: string;
  type: string; // 'local' | 'cosmos' | ...
  details: Record<string, any>;
}

function encrypt(obj: any): string {
  return CryptoJS.AES.encrypt(JSON.stringify(obj), SECRET_KEY).toString();
}

function decrypt(ciphertext: string): any {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
}

export function getConnections(): Connection[] {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return [];
  try {
    const arr: string[] = JSON.parse(encrypted);
    return arr.map(decrypt);
  } catch {
    return [];
  }
}

export function saveConnection(conn: Connection) {
  const connections = getConnections();
  connections.push(conn);
  const encryptedArr = connections.map(encrypt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedArr));
}

export function deleteConnection(id: string) {
  const connections = getConnections().filter(c => c.id !== id);
  const encryptedArr = connections.map(encrypt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedArr));
}

export function updateConnection(id: string, newObj: Connection) {
  const connections = getConnections().map(c => (c.id === id ? newObj : c));
  const encryptedArr = connections.map(encrypt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedArr));
} 