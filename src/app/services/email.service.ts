import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PosterList } from '../models/poster.model';
import { SurveyResult } from '../models/judge.model';
import { exportPosterCsv } from '../../utils/csv-export.util';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private apiUrl = '/api/send-email';

  constructor(private http: HttpClient) {}

  async sendPosterResultsEmail(poster: PosterList, surveys: SurveyResult[]): Promise<void> {
    if (!poster.email && !poster.advisorEmail) {
      alert('No valid recipient email found.');
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

    // Generate CSV content for attachment
    const csvContent = exportPosterCsv(poster.group, surveys, 'results', true);

    const payload = {
      server: 'smtp-relay.brevo.com',
      port: 587,
      senderName: 'STARS Judging Support',
      senderEmail: 'cgunay@ggc.edu',
      username: 'cengique@gmail.com',
      password: 'YOUR_SMTP_PASSWORD',
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
    } catch (err) {
      console.error('Email send failed:', err);
      alert('Failed to send email.');
    }
  }
}
