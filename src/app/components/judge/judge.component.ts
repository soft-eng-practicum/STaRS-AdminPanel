import {Component, OnInit, signal, computed, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JudgeSummary } from '../../models/judge.model';
import { exportJSurveyCSV } from '../../../utils/csv-export.util';
import { JudgeService } from '../../services/judge.service';
import {PouchdbService} from '../../services/pouchdb.service';

type SurveyRow = {
  groupId: string;
  groupName: string;
  answers: string[];
  total: number;
};

@Component({
  selector: 'app-judge',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './judge.component.html',
  styleUrls: ['./judge.component.scss']
})
export class JudgeComponent implements OnInit {
  exportFormat: 'csv' | 'pdf' = 'csv';

  judge = signal<JudgeSummary | null>(null);
  rawData = signal<SurveyRow[]>([]);

  sortField = signal<string>('groupId');
  sortDir = signal<'asc' | 'desc'>('asc');

  constructor(
    private route: ActivatedRoute,
    private pouch: JudgeService,
    private pouchdb: PouchdbService,
  ) {
    effect(() => {
      const _ = this.pouchdb.dbUpdated();
      this.loadJudgeData();
    });
  }

  judgeTitle = computed(() => this.judge()?.name ?? 'Judge');

  async ngOnInit(): Promise<void> {
    await this.loadJudgeData();

  }

  private async loadJudgeData(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const j = await this.pouch.getJudgeById(id);
    this.judge.set(j);

    if (j?.surveys?.length) {
      const rows: SurveyRow[] = j.surveys.map((s: any) => {
        const answers = Array.isArray(s.answers) ? [...s.answers] : [];
        while (answers.length < 7) answers.push('');
        const total = answers
          .slice(0, 6)
          .map(v => parseInt(v || '0', 10) || 0)
          .reduce((a, b) => a + b, 0);

        return {
          groupId: String(s.groupId ?? ''),
          groupName: String(s.groupName ?? ''),
          answers,
          total
        };
      });

      this.rawData.set(rows);
    }
  }

  get sortedRows(): SurveyRow[] {
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

  private getFieldValue(row: SurveyRow, field: string): string | number {
    if (field.startsWith('answers[')) {
      const match = field.match(/\d+/);
      const index = match ? Number(match[0]) : -1;
      return row.answers[index] ?? '';
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
    const j = this.judge();
    const s = this.rawData();
    if (this.exportFormat === 'csv' && j && s.length) {
      exportJSurveyCSV('JudgeResults', s, j.name);
    } else {
      alert('PDF export not implemented yet.');
    }
  }
}
