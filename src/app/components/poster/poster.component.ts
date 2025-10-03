import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosterList } from '../../models/poster.model';
import { PouchdbService } from '../../services/pouchdb.service';
import { PosterService } from '../../services/poster.service';
import { SurveyResult } from '../../models/judge.model';
import { exportPosterCsv } from '../../../utils/csv-export.util';

@Component({
  selector: 'app-poster-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poster.component.html',
  styleUrls: ['./poster.component.scss']
})
export class PosterComponent implements OnInit {
  poster?: PosterList;
  exportFormat: 'csv' | 'pdf' = 'csv';

  rawData = signal<SurveyResult[]>([]);
  sortField = signal<string>('judgeName');
  sortDir = signal<'asc' | 'desc'>('asc');

  constructor(
    private route: ActivatedRoute,
    private pouchdb: PouchdbService,
    private posterService: PosterService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const posters = await this.pouchdb.getPosters();
    this.poster = posters.find(p => String(p.id) === id);
    if (!this.poster) return;

    const surveys = await this.posterService.getGroupSurveys(String(this.poster.id));
    this.rawData.set(surveys);
  }

  get sortedRows(): SurveyResult[] {
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

  private getFieldValue(row: SurveyResult, field: string): string | number {
    if (field.startsWith('answers[')) {
      const idx = Number(field.match(/\d+/)?.[0] ?? -1);
      return row.answers[idx] ?? '';
    }
    return (row as any)[field] ?? '';
  }

  sortBy(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  getSortIcon(field: string): string {
    if (this.sortField() !== field) return '';
    return this.sortDir() === 'asc' ? 'ion-arrow-up-b' : 'ion-arrow-down-b';
  }

  export(): void {
    if (!this.poster || !this.rawData().length) {
      alert('No data to export.');
      return;
    }
    if (this.exportFormat === 'csv') {
      const filename = `Poster_${this.poster.id}_Results`;
      exportPosterCsv(this.poster.group, this.rawData(), filename);
    }else {
      alert('PDF export not implemented yet.');
    }
  }

  email(): void {
    alert('Email functionality not yet implemented.');
  }
}
