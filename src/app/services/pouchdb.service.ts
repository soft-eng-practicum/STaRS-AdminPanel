declare let PouchDB: any;

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Poster } from '../models/poster.model';


@Injectable({ providedIn: 'root' })
export class PouchdbService {
  private localDB: any;
  private remoteDB: any;

  constructor() {
    console.log('[PouchdbService] Initializing...');

    this.localDB = new PouchDB('conf');  // Local IndexedDB
    const remoteURL = `${environment.couch.protocol}://${environment.couch.username}:${environment.couch.password}@${environment.couch.host}:${environment.couch.port}/${environment.couch.confDB}`;
    this.remoteDB = new PouchDB(remoteURL);

    this.startSync();
  }

  private startSync(): void {
    this.localDB.sync(this.remoteDB, {
      live: true,
      retry: true
    })
      .on('change', (info: any) => console.log('[Sync] change:', info))
      .on('paused', (err: any) => console.log('[Sync] paused:', err))
      .on('active', () => console.log('[Sync] active/resumed'))
      .on('error', (err: any) => console.error('[Sync] error:', err));
  }

  async getPosters(): Promise<Poster[]> {
    try {
      const doc = await this.localDB.get(environment.configurationDocId);
      const postersJson = doc['posters_json'];

      if (!Array.isArray(postersJson)) {
        console.warn('[getPosters] posters_json is invalid or not an array.');
        return [];
      }

      return postersJson
        .filter((p: any) => p['Judged?'] === 'Yes')
        .map((p: any) => ({
          email: p['email'] ?? '',
          id: Number(p['id'] ?? 0),
          judges: [],
          countJudges: 0,
          group: p['group'] ?? p['Poster'] ?? '',
          subject: p['subject'] ?? '',
          students: p['students'] ?? '',
          advisor: p['advisor'] ?? '',
          advisorEmail: p['advisorEmail'] ?? '',
          score: 0
        }));
    } catch (err: any) {
      console.error(`[getPosters] Failed to load '${environment.configurationDocId}' from local DB.`, err);
      return [];
    }
  }
}
