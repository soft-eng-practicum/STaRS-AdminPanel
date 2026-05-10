declare const PouchDB: any;

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
  private confLocalDB: PouchDB.Database = null!;
  private confRemoteDB: PouchDB.Database = null!;
  private confDoc: any;

  // for judges
  private judgesLocalDB: PouchDB.Database = null!;
  private judgesRemoteDB: PouchDB.Database = null!;

  private dbInitComplete: Promise<void> = null!;
  private configProperties: string[] = ["feedbackLink", "postersDB", "judgesDB", "secret", "name", "logo"];

  constructor(private auth: AuthService) {}

  private getRemoteDB(databaseName: string): PouchDB.Database {
    return new PouchDB(`${environment.couch.protocol}://${this.auth.username}:${this.auth.password}@${environment.couch.host}:${environment.couch.port}/${databaseName}`);
  }

  async initDatabases(): Promise<void> {
    this.dbInitComplete = new Promise(async (res, rej) => {
        try {
          this.confLocalDB = new PouchDB('conf');
          this.confRemoteDB = this.getRemoteDB(environment.couch.confDB);

          this.startConfSync();
          this.confDoc = await this.confRemoteDB.get(environment.configurationDocId);

          this.judgesLocalDB = new PouchDB(this.confDoc.judgesDB);
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

  async getActiveConfig() {
    await this.dbInitComplete;
    const config = await this.confRemoteDB.get<Config>(environment.configurationDocId);
    if (!config.feedbackLink && (config as any)['feedback_link']) {
      config.feedbackLink = (config as any)['feedback_link'];
      delete (config as any)['feedback_link'];
      await this.confRemoteDB.put(config);
    }
    return config;
  }

  async getMetaConfig(): Promise<MetaConfig> {
    await this.dbInitComplete;
    try {
      return await this.confRemoteDB.get<MetaConfig>("meta-config");
    } catch (err: any) {
      if (err.status === 404) {
        const config = await this.getActiveConfig();
        let newConfig: any = {};
        this.configProperties.forEach(k => newConfig[k] = (config as any)[k]);
        const doc: MetaConfig = { _id: "meta-config", _rev: undefined!, configs: [{ configName: "Default", ...newConfig }], activeConfigName: "Default" };
        doc._rev = (await this.confRemoteDB.put(doc)).rev;
        if (config.logo && config._attachments && Object.values(config._attachments).length > 0) {
          const fileData = await this.confRemoteDB.getAttachment(environment.configurationDocId, config.logo);
          doc._rev = (await this.confRemoteDB.putAttachment(doc._id, config.logo, doc._rev, fileData, Object.values(config._attachments)[0].content_type)).rev;
        }
        return doc;
      } else {
        throw err;
      }
    }
  }

  async addLogo(metaConfig: MetaConfig, imageFile: File, id: string) {
    await this.dbInitComplete;
    metaConfig._rev = (await this.confRemoteDB.putAttachment("meta-config", id, metaConfig._rev, imageFile, imageFile.type)).rev;
    (metaConfig as any)._attachments = (await this.confRemoteDB.get<MetaConfig>("meta-config"))._attachments;
  }

  async updateMetaConfig(metaConfig: MetaConfig): Promise<void> {
    await this.dbInitComplete;
    metaConfig._rev = (await this.confRemoteDB.put(metaConfig)).rev;
  }

  async setActiveConfig(config: Config, metaConfig: MetaConfig): Promise<Config> {
    await this.dbInitComplete;
    const activeConfig = await this.getActiveConfig();
    if (activeConfig.logo) try {
      activeConfig._rev = (await this.confRemoteDB.removeAttachment(activeConfig._id, activeConfig.logo, activeConfig._rev)).rev;
      delete activeConfig._attachments;
    } catch {}
    (["name", "logo", "judgesDB", "postersDB", "feedbackLink", "secret"] as const).forEach(k => activeConfig[k] = config[k]!);
    activeConfig._rev = (await this.confRemoteDB.put(activeConfig)).rev;
    metaConfig.activeConfigName = config.configName;
    metaConfig._rev = (await this.confRemoteDB.put(metaConfig)).rev;
    if (activeConfig.logo) {
      const fileData = await this.confRemoteDB.getAttachment(metaConfig._id, activeConfig.logo);
      activeConfig._rev = (await this.confRemoteDB.putAttachment(activeConfig._id, activeConfig.logo, activeConfig._rev, fileData, "image/png")).rev;
    }
    return activeConfig;
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
