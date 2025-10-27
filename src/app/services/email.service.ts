import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SurveyResult } from '../models/judge.model';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private apiUrl = 'http://localhost:3000/api/send-email';

  constructor(private http: HttpClient) {}

  /**
   * Sends poster results email with labeled information instead of CSV.
   */
  async sendPosterEmail(
    to: string[],
    subject: string,
    text: string,
    filename: string,
    csvContent: string
  ): Promise<void> {
    const formattedBody = this.formatResultsAsLabels(csvContent);

    const fullMessage = `${text}\n\n----- Judging Results -----\n\n${formattedBody}`;

    const payload = {
      to,
      subject,
      text: fullMessage,
      // attachments: [{ filename, content: csvContent }] // backup
    };

    try {
      await this.http.post(this.apiUrl, payload).toPromise();
      this.showToast('Email sent successfully!');
    } catch (error) {
      console.error('Email send failed:', error);
      this.showToast('Failed to send email.', true);
      throw error;
    }
  }

  /**
   * Converts CSV data into a labeled text section.
   */
  private formatResultsAsLabels(csv: string): string {
    const lines = csv.trim().split('\n');
    const headers = lines.shift()?.split(',') ?? [];
    const rows = lines.map(l => l.split(','));

    return rows
      .map((cols, i) => {
        const labels = headers
          .map((h, idx) => `${h.trim()}: ${cols[idx]?.replace(/^"|"$/g, '') || ''}`)
          .join('\n  ');
        return `Judge #${i + 1}\n  ${labels}\n`;
      })
      .join('\n');
  }

  // --- Popup ---
  private showToast(message: string, isError = false): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.top = '40%';
    toast.style.right = '20px';
    toast.style.transform = 'translateY(-50%)';
    toast.style.zIndex = '9999';
    toast.style.background = isError ? '#c0392b' : '#27ae60';
    toast.style.color = 'white';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    toast.style.fontSize = '14px';
    toast.style.transition = 'opacity 0.3s ease';
    toast.style.opacity = '1';
    document.body.appendChild(toast);
    setTimeout(() => (toast.style.opacity = '0'), 2200);
    setTimeout(() => toast.remove(), 2500);
  }
}
