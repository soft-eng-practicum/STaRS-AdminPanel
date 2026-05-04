declare let PouchDB: any;

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Poster } from '../models/poster.model';
import { JudgeSummary } from '../models/judge.model';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PouchdbService {

  dbUpdated = signal<number>(0);
  syncingMessage = signal<string | null>(null);
  syncingStatus = signal<'syncing' | 'complete' | null>(null);

  // for config
  private confLocalDB: any;
  private confRemoteDB: any;
  private confDoc: any;

  // for judges
  private judgesLocalDB: any;
  private judgesRemoteDB: any;

  private dbInitComplete: Promise<void> = null!;

  constructor(private auth: AuthService) {}
  async initDatabases(): Promise<void> {
    this.dbInitComplete = new Promise(async (res, rej) => {
        try {
          const user = this.auth.username;
          const pass = this.auth.password;

          this.confLocalDB = new PouchDB('conf');
          const remoteURL = `${environment.couch.protocol}://${user}:${pass}@${environment.couch.host}:${environment.couch.port}/${environment.couch.confDB}`;
          this.confRemoteDB = new PouchDB(remoteURL);

          this.startConfSync();
          this.confDoc = await this.confRemoteDB.get(environment.configurationDocId);

          this.judgesLocalDB = new PouchDB(this.confDoc.judgesDB);
          const judgesURL = `${environment.couch.protocol}://${user}:${pass}@${environment.couch.host}:${environment.couch.port}/${this.confDoc.judgesDB}`;
          this.judgesRemoteDB = new PouchDB(judgesURL);

          this.startJudgesSync();
          this.initChangeWatchers();
          res();
        }
        catch {
          rej();
        }
    });
  }

  private startConfSync(): void {
    this.confLocalDB.sync(this.confRemoteDB, {live: true, retry: true})
        .on('change', (info: any) => {
          this.syncingMessage.set('Syncing data...');
          this.syncingStatus.set('syncing');
          this._clearMessage();
        })
        .on('paused', (err: any) => {
          if (!err) {
            this.syncingMessage.set('Sync complete.');
            this.syncingStatus.set('complete');
            this._clearMessage();
          }
        })
      .on('active', () => console.log('Syn active/resumed'))
        .on('error', (err: any) => {
          this.syncingMessage.set('DB connection error');
          this.syncingStatus.set('syncing');
          this._clearMessage();
          console.error('Judges Sync error:', err);
        });
  }

  private startJudgesSync(): void {
    this.judgesLocalDB.sync(this.judgesRemoteDB, { live: true, retry: true })
        .on('change', (info: any) => {
          this.syncingMessage.set('Syncing data...');
          this.syncingStatus.set('syncing');
          this._clearMessage();
        })
        .on('paused', (err: any) => {
          if (!err) {
            this.syncingMessage.set('Sync complete.');
            this.syncingStatus.set('complete');
            this._clearMessage();
          }
        })
      .on('active', () => console.log('Judges Sync active/resumed'))
      .on('error', (err: any) => {
        this.syncingMessage.set('DB connection error');
        this.syncingStatus.set('syncing');
        this._clearMessage();
        console.error('Judges Sync error:', err);
      });
    this.judgesLocalDB.info().then(console.log);

  }


  async getPosters(retry = 3): Promise<Poster[]> {
    await this.dbInitComplete;
    for (let i = 0; i < retry; i++) {
      try {
        const posterDocs = await new PouchDB(`${environment.couch.protocol}://${this.auth.username}:${this.auth.password}@${environment.couch.host}:${environment.couch.port}/${this.confDoc.postersDB}`).allDocs({ include_docs: true });

        const judgeDocs = await this.judgesLocalDB.allDocs({ include_docs: true });
        const allSurveys = judgeDocs.rows.flatMap((r: { doc: { surveys: any; }; }) =>
            Array.isArray(r.doc?.surveys) ? r.doc.surveys : []
        );

        return posterDocs.rows.map((r: any) => r.doc)
            .map((p: any) => {
              const groupId = String(p['id']);
              const surveys = allSurveys.filter((s: { groupId: any; }) => String(s.groupId) === groupId);

              const scores = surveys.map((s: { answers: any; }) =>
                  (s.answers ?? []).slice(0, 6)
                      .map((v: any) => parseInt(v) || 0)
                      .reduce((a: any, b: any) => a + b, 0)
              );

              const avgScore = scores.length
                  ? Math.round(scores.reduce((a: any, b: any) => a + b, 0) / scores.length) : 0;

              return {
                email: p['email'],
                id: Number(p['id']),
                judges: [],
                countJudges: surveys.length,
                group: p['group'],
                subject: p['subject'],
                students: p['students'],
                advisor: p['advisor'],
                advisorEmail: p['advisorEmail'],
                score: avgScore,
                judged: p['Judged?']
              };
            });
    } catch (err: any) {
      console.error(`Posters Failed to load '${environment.configurationDocId}' from local DB.`, err);
        if (i < retry - 1) {
          await new Promise(res => setTimeout(res, 500 * (i + 1))); // backoff
        } else {
          console.error(`Sync Failed after ${retry} attempts.`);
          return [];
        }
      }
    }

    return [];
  }


  async setPosters(posters: Poster[], overwrite: boolean): Promise<boolean> {
      try {
        const postersDB: PouchDB.Database = new PouchDB(`${environment.couch.protocol}://${this.auth.username}:${this.auth.password}@${environment.couch.host}:${environment.couch.port}/${this.confDoc.postersDB}`);
        
        if (overwrite) {
            const posters = await postersDB.allDocs({ include_docs: true });
            postersDB.bulkDocs(posters.rows.map(row => ({ _id: row.id, _rev: row.doc?._rev, _deleted: true })));
        }

        await postersDB.bulkDocs(posters);
        return true;
      } catch (err: any) {
        console.log(err);
        return false;
      }
  }


  async updatePosters(updates: any[]): Promise<void> {
    const postersDB: PouchDB.Database = new PouchDB(`${environment.couch.protocol}://${this.auth.username}:${this.auth.password}@${environment.couch.host}:${environment.couch.port}/${this.confDoc.postersDB}`);
    const posters: any[] = (await postersDB.allDocs({ include_docs: true })).rows.map(row => row.doc).filter((p: any) => updates.some((u: any) => u.id.toString() === p.id));
    updates.forEach(u => Object.keys(u).forEach(k => posters.find((p: any) => u.id.toString() === p.id)[k] = u[k].toString()));
    await postersDB.bulkDocs(posters);
  }


  async getJudges(): Promise<JudgeSummary[]> {
    await this.dbInitComplete;
    try {
      const res = await this.judgesLocalDB.allDocs({ include_docs: true });

      const judges: JudgeSummary[] = [];

      res.rows.forEach((row: any) => {
        const doc = row.doc;

        if (!doc || !doc._id) return;

        const judge: JudgeSummary = {
          id: doc._id,
          name: doc.username || doc._id,
          surveys: Array.isArray(doc.surveys) ? doc.surveys : [],
          surveyLength: 0,
          groupsSurveyed: []
        };

        judge.surveyLength = judge.surveys!.length;
        judge.groupsSurveyed = judge.surveys!.map((s: any) => ({
          id: s.groupId ?? '',
          name: s.groupName ?? ''
        }));

        judges.push(judge);
      });

      return judges;
    } catch (err) {
      console.error('Judges Error:', err);
      return [];
    }
  }

  async getJudgesRaw(): Promise<any[]> {
    await this.dbInitComplete;
    try {
      const res = await this.judgesLocalDB.allDocs({ include_docs: true });
      return res.rows.map((r: { doc: any; }) => r.doc);
    } catch (err) {
      console.error('Failed to load judges.');
      return [];
    }
  }

  private _clearMessage(): void {
    setTimeout(() => {
      this.syncingMessage.set(null);
      this.syncingStatus.set(null);
    }, 2000);
  }

  initChangeWatchers(): void {
    // Posters
    if (this.confLocalDB) {
      this.confLocalDB
        .changes({ since: 'now', live: true, include_docs: true })
        .on('change', () => this.onDatabaseChange());
    }

    // Judges
    if (this.judgesLocalDB) {
      this.judgesLocalDB
        .changes({ since: 'now', live: true, include_docs: true })
        .on('change', () => this.onDatabaseChange());
    }
  }

  private onDatabaseChange(): void {
    //  Notify the rest of the app
    this.dbUpdated.set(Date.now());
  }
}
