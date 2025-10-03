import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PouchdbService } from '../../services/pouchdb.service';
import { JudgeSummary } from '../../models/judge.model';

@Component({
  selector: 'app-judge-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './judge-list.component.html',
  styleUrls: ['./judge-list.component.scss']
})
export class JudgeListComponent implements OnInit {
  judges = signal<JudgeSummary[]>([]);
  searchValue = signal('');
  sortField = signal<'name' | 'surveyLength'>('name');
  sortDir = signal<'asc' | 'desc'>('asc');

  constructor(private pouchdb: PouchdbService) {}

  async ngOnInit(): Promise<void> {
    const list = await this.pouchdb.getJudges();
    this.judges.set(list);
  }

  get sortedFilteredJudges(): JudgeSummary[] {
    const needle = this.searchValue().toLowerCase();

    const filtered = this.judges().filter(j => {
      const haystack =
        (j.name ?? '') +
        ' ' +
        j.groupsSurveyed.map(g => `${g.id} ${g.name}`).join(' ');
      return haystack.toLowerCase().includes(needle);
    });

    return filtered.sort((a, b) => {
      let cmp = 0;
      if (this.sortField() === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = a.surveyLength - b.surveyLength;
      }
      return this.sortDir() === 'asc' ? cmp : -cmp;
    });
  }

  sortBy(field: 'name' | 'surveyLength'): void {
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
}
