import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosterList } from '../../models/poster.model';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PouchdbService } from '../../services/pouchdb.service';

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

  constructor(private pouchdb: PouchdbService) {}

  async ngOnInit(): Promise<void> {
    const list = await this.pouchdb.getPosters();
    this.posters.set(list);
  }

  get filteredPosters(): PosterList[] {
    return this.posters()
      .filter(p =>
        (p.group + p.students + p.advisor)
          .toLowerCase()
          .includes(this.searchValue.toLowerCase())
      )
      .sort((a, b) => {
        const valA = a[this.sortField] ?? '';
        const valB = b[this.sortField] ?? '';
        const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });//comparison
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

  getSortIcon(field:string): string {
    if (this.sortField !== field) return '';
    return this.sortDir === 'asc' ? 'ion-arrow-up-b' : 'ion-arrow-down-b';
  }
}
