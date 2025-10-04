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
              const answers = Array.isArray(survey.answers) ? [...survey.answers] : [];
              const total = answers
                .slice(0, 6)
                .map(a => parseInt(a) || 0)
                .reduce((sum, score) => sum + score, 0);

              result.push({
                judgeName: row.username,
                answers,
                total
              });
            }
          }
        }
      }

      return result;
    } catch (err) {
      console.error('Failed to get group surveys:', err);
      return [];
    }
  }

}
