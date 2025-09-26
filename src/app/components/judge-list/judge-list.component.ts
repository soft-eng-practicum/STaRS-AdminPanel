import { Component, OnInit } from '@angular/core';
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
  judges: JudgeSummary[] = [];

  searchValue = '';
  orderField: 'name' | 'surveyLength' = 'name';
  orderReverse = false;

  constructor(private pouchdb: PouchdbService) {}

  async ngOnInit(): Promise<void> {
    this.judges = await this.pouchdb.getJudges();

  }

  getFilteredJudges(): JudgeSummary[] {
    const needle = this.searchValue.toLowerCase();

    const filtered = this.judges.filter(j => {
      const haystack =
        (j.name ?? '') +
        ' ' +
        j.groupsSurveyed.map(g => `${g.id} ${g.name}`).join(' ');
      return haystack.toLowerCase().includes(needle);
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (this.orderField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        // surveyLength
        cmp = a.surveyLength - b.surveyLength;
      }
      return this.orderReverse ? -cmp : cmp;
    });

    return filtered;
  }

  toggleOrder(): void {
    this.orderReverse = !this.orderReverse;
  }

  setOrder(field: 'name' | 'surveyLength'): void {
    if (this.orderField === field) {
      this.toggleOrder();
    } else {
      this.orderField = field;
      this.orderReverse = false;
    }
  }
}
