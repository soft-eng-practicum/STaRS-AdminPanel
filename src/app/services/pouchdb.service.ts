declare const PouchDB: any;
export const META_CONFIG_ID = environment.metaConfigId;

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Poster } from '../models/poster.model';
import { JudgeSummary } from '../models/judge.model';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';
import { Config, MetaConfig } from '../models/config.model';

@Injectable({ providedIn: 'root' })
export class PouchdbService {
  dbUpdated = signal<number>(0);
  syncingMessage = signal<string | null>(null);
  syncingStatus = signal<'syncing' | 'complete' | null>(null);

  // for config
  private confLocalDB: PouchDB.Database = null!;
  private confRemoteDB: PouchDB.Database = null!;
  private confDoc: any;

  // for judges
  public judgesLocalDB: PouchDB.Database = null!;
  private judgesRemoteDB: PouchDB.Database = null!;

  private dbInitComplete: Promise<void> = null!;
  private configProperties: string[] = ["feedbackLink", "postersDB", "judgesDB", "secret", "name", "logo"];

  constructor(private auth: AuthService) {}

  private getRemoteDB(databaseName: string): PouchDB.Database {
    return new PouchDB(`${environment.couch.protocol}://${this.auth.username}:${this.auth.password}@${environment.couch.host}:${environment.couch.port}/${databaseName}`);
  }

  private getLocalDB(databaseName: string): PouchDB.Database {
    return new PouchDB(databaseName);
  }

  async initDatabases(): Promise<void> {
    this.dbInitComplete = new Promise(async (res, rej) => {
        try {
          this.confLocalDB = this.getLocalDB('conf');
          this.confRemoteDB = this.getRemoteDB(environment.couch.confDB);

          this.startConfSync();
          const metaConfig = await this.getMetaConfig(true);
          this.confDoc = metaConfig.configs.find(c => c.configName === metaConfig.activeConfigName);

          this.judgesLocalDB = this.getLocalDB(this.confDoc.judgesDB);
          this.judgesRemoteDB = this.getRemoteDB(this.confDoc.judgesDB);

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

  public generateDBName(configName: string, dbName: string) {
    return `${configName}-${dbName}-${crypto.randomUUID().split('-').at(-1)}`;
  }

  async getMetaConfig(init: boolean = false): Promise<MetaConfig> {
    if (!init) await this.dbInitComplete;
    try {
      return await this.confRemoteDB.get<MetaConfig>(META_CONFIG_ID);
    } catch (err: any) {
      if (err.status === 404) {
        const configName = "stars";
        const doc: MetaConfig = { _id: META_CONFIG_ID, _rev: undefined!, configs: [{ configName, postersDB: this.generateDBName(configName, "posters"), judgesDB: this.generateDBName(configName, "judges"), secret: crypto.randomUUID().split('-').at(-1)! }], activeConfigName: configName };
        doc._rev = (await this.confRemoteDB.put(doc)).rev;
        return doc;
      } else {
        throw err;
      }
    }
  }

  async getLogo(id: string) {
    return await this.confRemoteDB.getAttachment(META_CONFIG_ID, id);
  }

  async addLogo(metaConfig: MetaConfig, imageFile: File, id: string) {
    await this.dbInitComplete;
    metaConfig._rev = (await this.confRemoteDB.putAttachment(META_CONFIG_ID, id, metaConfig._rev, imageFile, imageFile.type)).rev;
    (metaConfig as any)._attachments = (await this.confRemoteDB.get<MetaConfig>(META_CONFIG_ID))._attachments;
  }

  async replaceLogo(metaConfig: MetaConfig, imageFile: File, id: string) {
    await this.dbInitComplete;
    metaConfig._rev = (await this.confRemoteDB.removeAttachment(META_CONFIG_ID, id, metaConfig._rev)).rev;
    metaConfig._rev = (await this.confRemoteDB.putAttachment(META_CONFIG_ID, id, metaConfig._rev, imageFile, imageFile.type)).rev;
    (metaConfig as any)._attachments = (await this.confRemoteDB.get<MetaConfig>(META_CONFIG_ID))._attachments;
  }

  async deleteConfig(metaConfig: MetaConfig, config: Config) {
    metaConfig.configs = metaConfig.configs.filter((c: any) => c.configName !== config.configName);
    await this.updateMetaConfig(metaConfig);
    if (config.logo) {
      metaConfig._rev = (await this.confRemoteDB.removeAttachment(META_CONFIG_ID, config.logo, metaConfig._rev)).rev;
    }
    await Promise.all([this.getRemoteDB(config.postersDB), this.getLocalDB(config.judgesDB), this.getRemoteDB(config.judgesDB)].map(db => db.destroy()));
  }

  async updateMetaConfig(metaConfig: MetaConfig): Promise<void> {
    await this.dbInitComplete;
    metaConfig._rev = (await this.confRemoteDB.put(metaConfig)).rev;
  }

  async setActiveConfig(config: Config, metaConfig: MetaConfig) {
    await this.dbInitComplete;
    metaConfig.activeConfigName = config.configName;
    metaConfig._rev = (await this.confRemoteDB.put(metaConfig)).rev;
    await this.initDatabases();
    await this.dbInitComplete;
  }

  async getPosters(retry = 3): Promise<Poster[]> {
    await this.dbInitComplete;
    for (let i = 0; i < retry; i++) {
      try {
        const posterDocs = await this.getRemoteDB(this.confDoc.postersDB).allDocs({ include_docs: true });

        const judgeDocs = await this.judgesLocalDB.allDocs({ include_docs: true });
        const allSurveys = judgeDocs.rows.flatMap((r: any) =>
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
      console.error(`Failed to load posters from local DB.`, err);
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
      await this.dbInitComplete;
      try {
        const postersDB = this.getRemoteDB(this.confDoc.postersDB);
        
        if (overwrite) {
          const posters = await postersDB.allDocs({ include_docs: true });
          await postersDB.bulkDocs(posters.rows.map(row => ({ _id: row.id, _rev: row.doc?._rev, _deleted: true })));
        }

        await postersDB.bulkDocs(posters);
        return true;
      } catch (err: any) {
        console.log(err);
        return false;
      }
  }


  async updatePosters(updates: any[]): Promise<void> {
    await this.dbInitComplete;
    const postersDB = this.getRemoteDB(this.confDoc.postersDB);
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
      return res.rows.map((r: any) => r.doc);
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
