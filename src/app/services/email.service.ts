import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PosterList } from '../models/poster.model';
import { SurveyResult } from '../models/judge.model';
import { exportPosterCsv } from '../../utils/csv-export.util';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private apiUrl = 'http://localhost:3000/api/send-email';

  constructor(private http: HttpClient) {}

  /**
   * Sends judging results via email for a given poster.
   */
  async sendPosterResultsEmail(poster: PosterList, surveys: SurveyResult[]): Promise<void> {
    if (!poster.email && !poster.advisorEmail) {
      alert('No recipient email found for this poster.');
      return;
    }

    const recipients = [poster.email, poster.advisorEmail].filter(Boolean).join(', ');
    const message = `
Dear authors,

Please see attached CSV file for your judging results for your poster presented at the STaRS event.

Poster Information:
- Author(s): ${poster.students}
- Advisor(s): ${poster.advisor}
- Title: ${poster.group}

Your poster was scored by ${surveys.length} judges.

Sincerely,
STARS Judging Support
`;

    // Use exportPosterCsv to get CSV text content
    const csvContent = exportPosterCsv(poster.group, surveys, 'results', true) as string;

    const payload = {
      to: recipients,
      subject: 'STaRS Judging Results and Feedback',
      text: message,
      attachments: [
        {
          filename: `${poster.group}_results.csv`,
          content: csvContent
        }
      ]
    };

    try {
      await this.http.post(this.apiUrl, payload).toPromise();
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Email send failed:', error);
      alert('Failed to send email.');
    }
  }
}
