import { Component, OnInit } from '@angular/core';
import { PouchService } from '../../pouch-service.service';
import { CommonModule } from '@angular/common'


@Component({
  selector: 'app-poster-list',
  templateUrl: './poster-list.component.html',
  styleUrls: ['./poster-list.component.scss']
})
export class PosterListComponent implements OnInit {

  public posters;
  constructor(private service: PouchService) {
  }

  ngOnInit() {
    this.posters = this.service.getPosters();
  }

}
