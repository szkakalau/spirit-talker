import Dexie, { type Table } from 'dexie';

export type EvpMarker = { startSec: number; endSec: number; label?: string };

export type EvpRecordingRow = {
  id?: number;
  createdAt: number;
  mime: string;
  durationSec: number;
  blob: Blob;
  markers: EvpMarker[];
};

class EvpDexie extends Dexie {
  recordings!: Table<EvpRecordingRow, number>;

  constructor() {
    super('spirit-talker-evp');
    this.version(1).stores({
      recordings: '++id, createdAt',
    });
  }
}

export const evpDb = new EvpDexie();
