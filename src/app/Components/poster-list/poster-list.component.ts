import { Component, OnInit } from '@angular/core';
import { PouchService } from '../../pouch-service.service';
import { CommonModule } from '@angular/common'


@Component({
  selector: 'app-poster-list',
  templateUrl: './poster-list.component.html',
  styleUrls: ['./poster-list.component.scss']
})
export class PosterListComponent implements OnInit {

  public poster;// = this.service.getPoster();
  //public x = this.poster[0];



  constructor(private service: PouchService) {
    //this.service = service;
    this.poster = this.service.getPoster();
   }

  ngOnInit() {
    //return this.service.getPoster();
      //.subscribe(data => this.poster = data);
  }

}
