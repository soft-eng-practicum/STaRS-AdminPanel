import { inject, Injectable } from '@angular/core';
import {JudgeDoc, JudgeSummary} from '../models/judge.model';
import { PouchdbService } from './pouchdb.service';

@Injectable({ providedIn: 'root' })
export class JudgeService {
  private localDB: any;
  private pouchdb = inject(PouchdbService);

  /**
   * Returns all surveys submitted for a given judge.
   */
  async getJudgeById(id: string): Promise<JudgeSummary | null> {
    this.localDB ??= this.pouchdb.judgesLocalDB;

    try {
      const doc = await this.localDB.get(id) as JudgeDoc;
      const surveys = Array.isArray(doc.surveys) ? doc.surveys : [];

      return {
        id: doc._id,
        name: doc.username || doc._id,
        surveys,
        surveyLength: surveys.length,
        groupsSurveyed: surveys.map((s: any) => ({
          id: String(s.groupId ?? ''),
          name: String(s.groupName ?? '')
        }))
      };
    } catch (err) {
      console.error(`[JudgeService] Could not find judge ${id}`, err);
      return null;
    }
  }
}
