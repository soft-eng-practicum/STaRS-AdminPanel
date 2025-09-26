import { Component, OnInit } from '@angular/core';
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
  surveys: SurveyResult[] = [];
  exportFormat: 'csv' | 'pdf' = 'csv';
  emailDest = '';

  constructor(
    private route: ActivatedRoute,
    private pouchdb: PouchdbService,
    private posterService: PosterService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
     // console.error('No poster id in route.');
      return;
    }

    // Load poster info
    const posters = await this.pouchdb.getPosters();
    this.poster = posters.find(p => String(p.id) === id);

    if (!this.poster) {
     // console.error('Poster not found.');
      return;
    }
    // Load survey results using PosterService
    this.surveys = await this.posterService.getGroupSurveys(String(this.poster.id));
  }

  export(): void {
    if (!this.poster || !this.surveys.length) {
      alert('No data to export.');
      return;
    }

    const filename = `Poster_${this.poster.id}_Results`;

    if (this.exportFormat === 'csv') {
      exportPosterCsv(this.poster.group, this.surveys, filename);
    } else if (this.exportFormat === 'pdf') {
      alert('PDF export not implemented yet. Choose CSV for now.');
      // TODO: Implement PDF
    }
  }

  email(): void {
    // TODO: hook into backend email service
  }
}
