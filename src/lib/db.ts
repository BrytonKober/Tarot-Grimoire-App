import { openDB, DBSchema } from 'idb';
import { Spread } from '../types';

export interface FloatingImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface GrimoirePage {
  id: string;
  title: string;
  content: any; // Tiptap JSON content
  images?: FloatingImage[];
  updatedAt: number;
  createdAt: number;
}

export interface TarotSnapshot {
  id: string;
  title: string;
  spread: Spread;
  createdAt: number;
}

interface TarotDB extends DBSchema {
  pages: {
    key: string;
    value: GrimoirePage;
    indexes: { 'by-updated': number };
  };
  snapshots: {
    key: string;
    value: TarotSnapshot;
    indexes: { 'by-created': number };
  };
}

export const dbPromise = openDB<TarotDB>('tarot-grimoire-db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('pages')) {
      const pageStore = db.createObjectStore('pages', { keyPath: 'id' });
      pageStore.createIndex('by-updated', 'updatedAt');
    }

    if (!db.objectStoreNames.contains('snapshots')) {
      const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id' });
      snapshotStore.createIndex('by-created', 'createdAt');
    }
  },
});
