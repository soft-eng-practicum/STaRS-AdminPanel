import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JudgeSummary } from '../../models/judge.model';
import { exportJSurveyCSV } from '../../../utils/csv-export.util';
import { JudgeService } from '../../services/judge.service';

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
  exportFormat = 'csv';

  judge = signal<JudgeSummary | null>(null);
  surveys = signal<SurveyRow[]>([]);

  judgeTitle = computed(() => this.judge()?.name ?? 'Judge');

  constructor(
    private route: ActivatedRoute,
    private pouch: JudgeService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const j = await this.pouch.getJudgeById(id);
    this.judge.set(j);

    if (j?.surveys?.length) {
      const rows: SurveyRow[] = j.surveys.map((s: any) => {
        const answers = Array.isArray(s.answers) ? [...s.answers] : [];
        while (answers.length < 7) answers.push('');
        const total =
          answers.slice(0, 6)
            .map((v: any) => Number.parseInt(String(v), 10) || 0)
            .reduce((a, b) => a + b, 0);

        return {
          groupId: String(s.groupId ?? ''),
          groupName: String(s.groupName ?? ''),
          answers,
          total
        };
      });

      this.surveys.set(rows);
    }
  }

  export(): void {
      const j = this.judge();
      const s = this.surveys();
      if (this.exportFormat === 'csv' && j && s.length) {
        exportJSurveyCSV('JudgeResults', s, j.name);
      } else {
        alert('PDF export not implemented yet. Choose CSV for now.');
      }
    }

  }
