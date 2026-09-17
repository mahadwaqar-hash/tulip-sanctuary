import Dexie, { type EntityTable } from 'dexie';

export interface Message {
  id: string;
  sender: 'Mahad' | 'Ifa';
  type: 'text' | 'image' | 'sticker' | 'gif' | 'audio';
  content: string;
  mediaUrl?: string;
  audioDuration?: number;
  reactions?: string[];
  createdAt: number;
}

export interface Sticker {
  id: string;
  name: string;
  dataUrl: string;
  category?: string;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  category: 'date' | 'anniversary' | 'call' | 'trip' | 'special';
  note?: string;
  addedBy: 'Mahad' | 'Ifa';
  createdAt: number;
}

export interface VaultPhoto {
  id: string;
  dataUrl: string;
  caption: string;
  date: string;
  location?: string;
  addedBy: 'Mahad' | 'Ifa';
  createdAt: number;
}

export interface ScratchpadNote {
  id: string;
  content: string;
  updatedAt: number;
}

export interface LdrLetter {
  id: string;
  title: string;
  content: string;
  sender: 'Mahad' | 'Ifa';
  recipient: 'Mahad' | 'Ifa';
  isOpened: boolean;
  openedAt?: number;
  createdAt: number;
}

export interface LovePing {
  id: string;
  sender: 'Mahad' | 'Ifa';
  recipient: 'Mahad' | 'Ifa';
  type: 'hug' | 'kiss' | 'thinking' | 'stars';
  createdAt: number;
}

export interface AppSetting {
  id: string;
  sanctuaryPassword?: string;
  photoPassword?: string;
  mahadCity?: string;
  ifaCity?: string;
  reunionDate?: string;
  tulipWaterCount?: number;
  lastWatered?: number;
  startDate?: string;
}

const db = new Dexie('TulipSanctuaryCutesyDB') as Dexie & {
  messages: EntityTable<Message, 'id'>;
  stickers: EntityTable<Sticker, 'id'>;
  calendarEvents: EntityTable<CalendarEvent, 'id'>;
  vaultPhotos: EntityTable<VaultPhoto, 'id'>;
  scratchpad: EntityTable<ScratchpadNote, 'id'>;
  ldrLetters: EntityTable<LdrLetter, 'id'>;
  lovePings: EntityTable<LovePing, 'id'>;
  settings: EntityTable<AppSetting, 'id'>;
};

// Schema declaration
db.version(3).stores({
  messages: 'id, createdAt, sender, type',
  stickers: 'id, createdAt, name, category',
  calendarEvents: 'id, date, category, addedBy',
  vaultPhotos: 'id, createdAt, date, addedBy',
  scratchpad: 'id, updatedAt',
  ldrLetters: 'id, createdAt, sender, recipient, isOpened',
  lovePings: 'id, createdAt, sender, recipient',
  settings: 'id'
});

export { db };
