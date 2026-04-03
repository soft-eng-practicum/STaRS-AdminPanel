import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private apiUrl = environment.emailApiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Existing single-poster sender you’re already using from PosterComponent.
   * Builds labeled text in the body from csvContent and posts to backend.
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
      // attachments: [{ filename, content: csvContent }] // backup (left commented)
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
   * NEW: Bulk sender for Poster List “Email Multiple”.
   * Accepts multiple per-poster payloads and sends them sequentially,
   * showing one final toast when complete.
   */
  async sendBulkPosterEmails(items: Array<{
    to: string[];
    subject: string;
    text: string;
    filename: string;
    csvContent: string;
  }>): Promise<void> {
    let successCount = 0;

    for (const item of items) {
      try {
        const formattedBody = this.formatResultsAsLabels(item.csvContent);
        const fullMessage = `${item.text}\n\n----- Judging Results -----\n\n${formattedBody}`;

        const payload = {
          to: item.to,
          subject: item.subject,
          text: fullMessage,
          // attachments: [{ filename: item.filename, content: item.csvContent }] // backup (commented)
        };

        await this.http.post(this.apiUrl, payload).toPromise();
        successCount++;
      } catch (err) {
        console.error('Bulk email failure on one item:', err);

      }
    }

    if (successCount > 0) {
      this.showToast(`Emails sent for ${successCount} poster(s).`);
    } else {
      this.showToast('No emails were sent.', true);
      throw new Error('Bulk email failed for all items.');
    }
  }

  /** Converts CSV to labeled text block used inline in the email body. */
  private formatResultsAsLabels(csv: string): string {
    const lines = (csv || '').trim().split('\n');
    if (!lines.length) return '';

    const headers = (lines.shift() || '').split(',').map(h => h.trim());
    const rows = lines.map(l => l.split(','));

    return rows
      .map((cols, i) => {
        const labels = headers
          .map((h, idx) => `${h}: ${(cols[idx] || '').replace(/^"|"$/g, '')}`)
          .join('\n  ');
        return `Judge #${i + 1}\n  ${labels}\n`;
      })
      .join('\n');
  }

  // small toast helper
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
