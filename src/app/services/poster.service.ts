import { Injectable } from '@angular/core';
import { PouchdbService } from './pouchdb.service';
import { SurveyResult } from '../models/judge.model';

@Injectable({ providedIn: 'root' })
export class PosterService {
  constructor(private pouchdb: PouchdbService) {}

  /**
   * Returns all surveys submitted for a given poster (groupId).
   */
  async getGroupSurveys(groupId: string): Promise<SurveyResult[]> {
    const result: SurveyResult[] = [];

    try {
      const res = await this.pouchdb.getJudgesRaw();

      for (const row of res) {
        if (row?.surveys?.length) {
          for (const survey of row.surveys) {
            if (survey.groupId === groupId) {
              result.push({
                judgeName: row.username,
                answers: [...survey.answers]
              });
            }
          }
        }
      }

      return result;
    } catch (err) {
      console.error('ailed to get group surveys:', err);
      return [];
    }
  }
}
