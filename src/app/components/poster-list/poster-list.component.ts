import { Component, OnInit } from '@angular/core';
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
  posters: PosterList[] = [];
  searchValue = '';
  orderField: keyof PosterList = 'id';
  orderReverse = true;

  constructor(private pouchdb: PouchdbService) {}

  async ngOnInit(): Promise<void> {
    this.posters = await this.pouchdb.getPosters();

  }

  getFilteredPosters(): PosterList[] {
    return this.posters
      .filter(p =>
        (p.group + p.students + p.advisor)
          .toLowerCase()
          .includes(this.searchValue.toLowerCase())
      )
      .sort((a, b) => {
        const valA = a[this.orderField] ?? '';
        const valB = b[this.orderField] ?? '';
        const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return this.orderReverse ? -comparison : comparison;
      });
  }

  toggleOrder(): void {
    this.orderReverse = !this.orderReverse;
  }
}
