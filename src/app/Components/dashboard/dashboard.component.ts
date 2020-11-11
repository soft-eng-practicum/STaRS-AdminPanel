import { Component, OnInit } from '@angular/core';
import { PouchService } from 'src/app/pouch-service.service';
import { ComponentModule } from '../component/component.module';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {

  pouchService: any;

  constructor(pouchService: PouchService) {
    this.pouchService = pouchService;
  }

  ngOnInit() {}

  sync()
  {
    this.pouchService.sync();
  }

}
