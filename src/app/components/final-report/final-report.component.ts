import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PouchdbService } from '../../services/pouchdb.service';
import { exportFinalReportCSV } from '../../../utils/csv-export.util';

interface SurveyRow {
  judgeName: string;
  groupId: string;
  groupName: string;
  answers: string[];
}

@Component({
  selector: 'app-final-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './final-report.component.html',
  styleUrls: ['./final-report.component.scss']
})
export class FinalReportComponent implements OnInit {
  exportFormat: 'csv' | 'pdf' = 'csv';

  rawData = signal<SurveyRow[]>([]);
  sortField = signal<keyof SurveyRow | `answers[${number}]` | ''>('judgeName');
  sortDir = signal<'asc' | 'desc'>('asc');

  constructor(private pouchdb: PouchdbService) {}

  async ngOnInit(): Promise<void> {
    const docs = await this.pouchdb.getJudgesRaw();

    const allSurveys: SurveyRow[] = [];

    for (const doc of docs) {
      const surveys = Array.isArray(doc.surveys) ? doc.surveys : [];
      for (const s of surveys) {
        allSurveys.push({
          judgeName: doc.username ?? doc._id,
          groupId: String(s.groupId ?? ''),
          groupName: String(s.groupName ?? ''),
          answers: Array.isArray(s.answers) ? s.answers : []
        });
      }
    }

    this.rawData.set(allSurveys);
  }

  sortBy(field: keyof SurveyRow | `answers[${number}]`) {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }


  get sortedRows(): SurveyRow[] {
    const field = this.sortField();
    const dir = this.sortDir();
    const data = [...this.rawData()];

    if (!field) return data;

    return data.sort((a, b) => {
      const aVal = this.getFieldValue(a, field);
      const bVal = this.getFieldValue(b, field);

      return dir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  private getFieldValue(row: SurveyRow, field: string): string | number {
    if (field.startsWith('answers[')) {
      const index = Number(field.match(/\d+/)?.[0]);
      return row.answers[index] ?? '';
    }
    return (row as any)[field] ?? '';
  }

  getSortIcon(field: string): string {
    if (this.sortField() !== field) return '';
    return this.sortDir() === 'asc' ? 'ion-arrow-up-b' : 'ion-arrow-down-b';
  }


  export(): void {
    if (this.exportFormat === 'csv') {
      exportFinalReportCSV('FinalReport', this.rawData());
    } else {
      alert('PDF export not implemented yet.');
    }
  }
}
