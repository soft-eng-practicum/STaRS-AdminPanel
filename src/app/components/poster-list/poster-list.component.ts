import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosterList } from '../../models/poster.model';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PouchdbService } from '../../services/pouchdb.service';
import { PosterService } from '../../services/poster.service';
import { EmailService } from '../../services/email.service';
import { exportPosterCsv } from '../../../utils/csv-export.util';

declare const $: any;

@Component({
  selector: 'app-poster-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './poster-list.component.html',
  styleUrls: ['./poster-list.component.scss']
})
export class PosterListComponent implements OnInit {
  posters = signal<PosterList[]>([]);
  searchValue = '';
  sortField: keyof PosterList = 'id';
  sortDir: 'asc' | 'desc' = 'asc';

  // ---- Email Multiple state ----
  selectedPosters: PosterList[] = [];

  globalToList: string[] = [];
  newGlobalRecipient = '';

  emailSubject = 'STaRS judging scores and feedback';
  emailBodyTemplate =
    'Dear authors,\n\n' +
    'Please see below the judging results for your poster presented at the STaRS event.\n\n' +
    'Poster information and the labeled results will be included in the message.\n\n' +
    'Sincerely,\nSTARS Judging Support';

  emailError = '';
  sending = false;

  constructor(
    private pouchdb: PouchdbService,
    private posterSvc: PosterService,
    private emailSvc: EmailService
  ) {
    effect(() => {
      const _ = this.pouchdb.dbUpdated();
      this.reloadData();
    });
  }

  async ngOnInit(): Promise<void> {
    const list = await this.pouchdb.getPosters();
    this.posters.set(list);
  }

  private async reloadData(): Promise<void> {
    const updatedList = await this.pouchdb.getPosters();
    this.posters.set(updatedList);

    // keep selected posters that still exist after reload
    this.selectedPosters = this.selectedPosters
      .map(sel => updatedList.find(p => p.id === sel.id))
      .filter((p): p is PosterList => !!p);
  }

  get filteredPosters(): PosterList[] {
    return this.posters()
      .filter(p =>
        (p.group + p.students + p.advisor + p.id)
          .toLowerCase()
          .includes(this.searchValue.toLowerCase())
      )
      .sort((a, b) => {
        const valA = a[this.sortField] ?? '';
        const valB = b[this.sortField] ?? '';
        const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return this.sortDir === 'asc' ? cmp : -cmp;
      });
  }

  sortBy(field: keyof PosterList): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
  }

  sortByDir(field: keyof PosterList, dir: "desc" | "asc") {
    this.sortField = field;
    this.sortDir = dir;
  }

  getSortIcon(field: string): string {
    if (this.sortField !== (field as keyof PosterList)) return '';
    return this.sortDir === 'asc' ? 'ion-arrow-up-b' : 'ion-arrow-down-b';
  }

  // checkbox handler from template
  onPosterCheckboxChange(event: Event, poster: PosterList): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    this.togglePoster(poster, input.checked);
  }

  // ---- selection helpers ----
  isSelected(p: PosterList): boolean {
    return this.selectedPosters.some(sel => sel.id === p.id);
  }

  togglePoster(p: PosterList, checked: boolean): void {
    if (checked) {
      if (!this.isSelected(p)) this.selectedPosters.push(p);
    } else {
      this.selectedPosters = this.selectedPosters.filter(sel => sel.id !== p.id);
    }
  }

  selectAll(): void {
    this.selectedPosters = [...this.filteredPosters];
  }

  clearAll(): void {
    this.selectedPosters = [];
  }

  // ---- bulk actions entry point ----
  onBulkEmail(): void {
    this.emailError = '';
    if (!this.selectedPosters.length) {
      this.showToast('Please select at least one poster first.', true);
      return;
    }
    this.openMultiEmailModal();
  }

  openMultiEmailModal(): void {
    this.emailError = '';
    $('#multiEmailModal').modal('show');
  }

  closeMultiEmailModal(): void {
    $('#multiEmailModal').modal('hide');
    setTimeout(() => {
      $('.modal-backdrop').remove();
      $('body')
        .removeClass('modal-open')
        .css('padding-right', '')
        .css('overflow', 'auto');
    }, 50);
  }

  // ---- global recipients ----
  addGlobalRecipient(): void {
    const v = (this.newGlobalRecipient || '').trim();
    if (!v) return;
    if (!this.isValidEmail(v)) {
      this.emailError = 'Please enter a valid email address.';
      return;
    }
    if (!this.globalToList.includes(v)) this.globalToList.push(v);
    this.newGlobalRecipient = '';
    this.emailError = '';
  }

  removeGlobalRecipient(i: number): void {
    this.globalToList.splice(i, 1);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ---- Bulk send ----
  async sendMultipleEmails(): Promise<void> {
    if (!this.selectedPosters.length) {
      this.emailError = 'Please select at least one poster.';
      return;
    }

    this.sending = true;
    this.emailError = '';

    try {
      const items: Array<{
        to: string[];
        subject: string;
        text: string;
        filename: string;
        csvContent: string;
      }> = [];

      const postersCount = this.posters().length;

      for (const poster of this.selectedPosters) {
        const surveys = await this.posterSvc.getGroupSurveys(String(poster.id));
        const csvString = exportPosterCsv(poster.group, surveys, 'results', true) as string;

        const judgesCount = surveys.length;
        const header =
          `Dear authors,\n\n` +
          `Please see below the judging results for your poster presented at the STaRS event.\n\n` +
          `Project information:\n\n` +
          `Author(s): ${poster.students}\n` +
          `Advisor(s): ${poster.advisor}\n` +
          `Title: ${poster.group}\n\n` +
          `We had ${postersCount} posters judged at the event. Your poster was scored by ${judgesCount} judge(s).\n\n`;

        const text = `${header}${this.emailBodyTemplate}`;

        const perPosterRecipients = [poster.email, poster.advisorEmail]
          .filter((e): e is string => !!e && !!e.trim());

        const mergedRecipients = Array.from(
          new Set([...perPosterRecipients, ...this.globalToList])
        );

        if (!mergedRecipients.length) continue;

        items.push({
          to: mergedRecipients,
          subject: this.emailSubject,
          text,
          filename: `${poster.group}_results.csv`,
          csvContent: csvString
        });
      }

      if (!items.length) {
        this.emailError = 'No valid recipients for the selected posters.';
        this.sending = false;
        return;
      }

      await this.emailSvc.sendBulkPosterEmails(items);

      this.showToast(`Emails sent for ${items.length} poster(s).`);
      this.closeMultiEmailModal();
    } catch (err) {
      console.error(err);
      this.emailError = 'Failed to send one or more emails. Please try again.';
    } finally {
      this.sending = false;
    }
  }

  // ---- small toast (top-right middle) ----
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
