import { Component, effect, OnInit, signal, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Poster } from '../../models/poster.model';
import { PouchdbService } from '../../services/pouchdb.service';
import { PosterService } from '../../services/poster.service';
import { SurveyResult } from '../../models/judge.model';
import { exportPosterCsv } from '../../../utils/csv-export.util';
import { EmailService } from '../../services/email.service';

declare const $: any;

@Component({
  selector: 'app-poster-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poster.component.html',
  styleUrls: ['./poster.component.scss']
})
export class PosterComponent implements OnInit, AfterViewInit {
  poster?: Poster;
  exportFormat: 'csv' | 'pdf' = 'csv';

  criteriaLabels = [
    'Statement of Problem',
    'Methodology',
    'Results/Solution',
    'Oral Presentation',
    'Poster Layout',
    'Impact'
  ];

  rawData = signal<SurveyResultWithTotal[]>([]);
  sortField = signal<'judgeName' | `answers[${number}]` | 'total'>('judgeName');
  sortDir = signal<'asc' | 'desc'>('asc');

  // Email modal state
  toList: string[] = [];
  suggestedRecipients: string[] = [];
  newRecipient = '';
  emailSubject = 'STaRS judging scores and feedback';
  emailBody = '';
  attachmentName = 'results.csv';
  sendingEmail = false;
  emailError = '';

  private postersCount = 0;

  constructor(
    private route: ActivatedRoute,
    private pouchdb: PouchdbService,
    private posterService: PosterService,
    private emailService: EmailService
  ) {
    // live re-load on local DB changes
    effect(() => {
      const _ = this.pouchdb.dbUpdated();
      this.loadPosterData();
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadPosterData();
  }

  ngAfterViewInit(): void {
    // Guarantee body is restored if user closes via backdrop/X
    $('#emailEditModal').on('hidden.bs.modal', () => this.cleanModalState());
  }

  // -------------------- Data load --------------------
  private async loadPosterData(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const posters = await this.pouchdb.getPosters();
    this.postersCount = posters.length;
    this.poster = posters.find(p => String(p.id) === id);
    if (!this.poster) return;

    const surveys = await this.posterService.getGroupSurveys(String(this.poster.id));
    const processed = surveys.map(s => {
      const total = s.answers
        .slice(0, 6)
        .reduce((sum, val) => sum + (parseInt(val) || 0), 0);
      return { ...s, total };
    });

    this.rawData.set(processed);
  }

  // -------------------- Table / Sorting --------------------
  get sortedRows(): SurveyResultWithTotal[] {
    const field = this.sortField();
    const dir = this.sortDir();
    const data = [...this.rawData()];

    return data.sort((a, b) => {
      const aVal = this.getFieldValue(a, field);
      const bVal = this.getFieldValue(b, field);
      return dir === 'asc'
        ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        : String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
    });
  }

  private getFieldValue(row: SurveyResultWithTotal, field: string): string | number {
    if (field === 'total') return row.total;
    if (field.startsWith('answers[')) {
      const idx = Number(field.match(/\d+/)?.[0] ?? -1);
      return row.answers[idx] ?? '';
    }
    return (row as any)[field] ?? '';
  }

  sortBy(field: 'judgeName' | `answers[${number}]` | 'total'): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  getSortIcon(field: 'judgeName' | `answers[${number}]` | 'total'): string {
    if (this.sortField() !== field) return '';
    return this.sortDir() === 'asc' ? 'ion-arrow-up-b' : 'ion-arrow-down-b';
  }

  answerField(index: number): `answers[${number}]` {
    return `answers[${index}]`;
  }

  sortAnswer(index: number): void {
    this.sortBy(this.answerField(index));
  }

  // -------------------- Export --------------------
  export(): void {
    if (!this.poster || !this.rawData().length) {
      alert('No data to export.');
      return;
    }
    if (this.exportFormat === 'csv') {
      const filename = `Poster_${this.poster.id}_Results`;
      exportPosterCsv(this.poster.group, this.rawData(), filename);
    } else {
      alert('PDF export not implemented yet.');
    }
  }

  // -------------------- Email (modal flow) --------------------
  async email(): Promise<void> {
    this.openEmailModal();
  }

  openEmailModal(): void {
    if (!this.poster) return;

    this.emailError = '';

    // Prefill recipients
    const seeds = [
      this.poster.email?.trim(),
      this.poster.advisorEmail?.trim()
    ].filter((e): e is string => !!e);
    this.toList = Array.from(new Set(seeds));
    this.suggestedRecipients = seeds.filter(e => !this.toList.includes(e));

    // Prefill subject + body (body includes labeled results exactly as emailed)
    this.emailSubject = 'STaRS judging scores and feedback';
    this.emailBody = this.buildEmailBody(); // includes the labeled results section

    // Show modal
    $('#emailEditModal').modal('show');
  }

  addRecipient(): void {
    const v = (this.newRecipient || '').trim();
    if (!v) return;
    if (!this.isValidEmail(v)) {
      this.emailError = 'Please enter a valid email address.';
      return;
    }
    if (!this.toList.includes(v)) this.toList.push(v);
    this.newRecipient = '';
    this.emailError = '';
  }

  addRecipientFromSuggestion(email: string): void {
    if (!this.toList.includes(email)) this.toList.push(email);
  }

  removeRecipient(index: number): void {
    this.toList.splice(index, 1);
  }

  async sendEmail(): Promise<void> {
    if (!this.poster || !this.rawData().length) {
      this.emailError = 'No data to email.';
      return;
    }
    if (!this.toList.length) {
      this.emailError = 'Please add at least one recipient.';
      return;
    }

    // Build a CSV string only to generate labeled text (attachments are commented out in the service)
    const csvString = this.buildPosterCsvString(this.poster.group, this.rawData());
    const subject = this.emailSubject;
    const text = this.emailBody; // already includes results

    this.sendingEmail = true;
    this.emailError = '';

    try {
      await this.emailService.sendPosterEmail(this.toList, subject, text, this.attachmentName, csvString);
      this.closeModal();
    } catch (err) {
      console.error('Email send failed:', err);
      this.emailError = 'Failed to send email. Please try again.';
    } finally {
      this.sendingEmail = false;
    }
  }

  private closeModal(): void {
    $('#emailEditModal').modal('hide');
    this.cleanModalState();
  }

  private cleanModalState(): void {
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open');
    $('body').css('padding-right', '');
    $('body').css('overflow', 'auto');
  }

  // -------------------- Helpers --------------------
  private buildEmailBody(): string {
    const judgesCount = this.rawData().length;
    const students = this.poster?.students ?? '';
    const advisor = this.poster?.advisor ?? '';
    const title = this.poster?.group ?? '';

    // Labeled results (same shape as EmailService.formatResultsAsLabels)
    const resultsSection = this.formatResultsAsLabels(
      this.buildPosterCsvString(this.poster?.group ?? '', this.rawData())
    );

    return [
      'Dear authors,',
      '',
      'Please see your judging results for your poster below (included directly in this email).',
      '',
      'Poster information:',
      `Author(s): ${students}`,
      `Advisor(s): ${advisor}`,
      `Title: ${title}`,
      '',
      `We had ${this.postersCount} posters judged at the event. Your poster was scored by ${judgesCount} judge(s).`,
      '',
      '----- Judging Results -----',
      resultsSection,
      '',
      'Sincerely,',
      'Dr. Cengiz Gunay'
    ].join('\n');
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private buildPosterCsvString(_posterTitle: string, rows: SurveyResultWithTotal[]): string {
    const header = [
      'Judge',
      'Statement of Problem',
      'Methodology',
      'Results/Solution',
      'Oral Presentation',
      'Poster Layout',
      'Impact',
      'Total',
      'Additional Comments'
    ];
    const csvRows = rows.map(r => [
      r.judgeName,
      r.answers[0] ?? '',
      r.answers[1] ?? '',
      r.answers[2] ?? '',
      r.answers[3] ?? '',
      r.answers[4] ?? '',
      r.answers[5] ?? '',
      String(r.total ?? ''),
      `"${String(r.answers[6] ?? '').replace(/"/g, '""')}"`
    ]);
    return [header, ...csvRows].map(cols => cols.join(',')).join('\n');
  }

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
}

interface SurveyResultWithTotal extends SurveyResult {
  total: number;
}
