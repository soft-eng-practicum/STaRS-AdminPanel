declare let PouchDB: any;

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { PosterList } from '../models/poster.model';
import { JudgeSummary } from '../models/judge.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PouchdbService {
  //for posters
  private localDB: any;
  private remoteDB: any;

  //for judges
  private judgesLocalDB: any;
  private judgesRemoteDB: any;
  private judgesDBName = environment.couch.judgesDB;

  constructor(private auth: AuthService) {
    const user = this.auth.username;
    const pass = this.auth.password;
    //posters
    this.localDB = new PouchDB('conf');
    const remoteURL = `http://${user}:${pass}@${environment.couch.host}:${environment.couch.port}/${environment.couch.confDB}`;
    this.remoteDB = new PouchDB(remoteURL);

    this.startConfSync();

    //judges
    this.judgesLocalDB = new PouchDB(this.judgesDBName);
    const judgesURL = `http://${user}:${pass}@${environment.couch.host}:${environment.couch.port}/${environment.couch.judgesDB}`;
    this.judgesRemoteDB = new PouchDB(judgesURL);
    this.startJudgesSync();

  }

  private startConfSync(): void {
    this.localDB.sync(this.remoteDB, {live: true, retry: true})
      .on('change', (info: any) => console.log('Sync change:', info))
      .on('paused', (err: any) => console.log('Sync paused:', err))
      .on('active', () => console.log('Syn active/resumed'))
      .on('error', (err: any) => console.error('Sync error:', err));

  }

  private startJudgesSync(): void {
    this.judgesLocalDB.sync(this.judgesRemoteDB, { live: true, retry: true })
      .on('change', (info: any) => console.log('Judges Sync change:', info))
      .on('paused', (err: any) => console.log('Judges Sync paused:', err))
      .on('active', () => console.log('Judges Sync active/resumed'))
      .on('error', (err: any) => console.error('Judges Sync error:', err));
    this.judgesLocalDB.info().then(console.log);

  }


  async getPosters(retry = 3): Promise<PosterList[]> {
    for (let i = 0; i < retry; i++) {
      try {
        const doc = await this.localDB.get(environment.configurationDocId);
        const postersJson = doc['posters_json'];

      if (!Array.isArray(postersJson)) {
        console.warn('getPosters posters_json is invalid.');
        return [];
      }

      return postersJson
        .filter((p: any) => p['Judged?'] === 'Yes')
        .map((p: any) => ({
          email: p['email'],
          id: Number(p['id']),
          judges: [],
          countJudges: 0,
          group: p['group'],
          subject: p['subject'],
          students: p['students'],
          advisor: p['advisor'],
          advisorEmail: p['advisorEmail'],
          score: 0
        }));
    } catch (err: any) {
      console.error(`Posters Failed to load '${environment.configurationDocId}' from local DB.`, err);
        if (i < retry - 1) {
          await new Promise(res => setTimeout(res, 1000 * (i + 1))); // backoff
        } else {
          console.error(`Sync Failed after ${retry} attempts.`);
          return [];
        }
      }
    }

    return [];
  }


  async getJudges(): Promise<JudgeSummary[]> {
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
    try {
      const res = await this.judgesLocalDB.allDocs({ include_docs: true });
      return res.rows.map((r: { doc: any; }) => r.doc);
    } catch (err) {
      console.error(' Failed to load judge');
      return [];
    }
  }



}
