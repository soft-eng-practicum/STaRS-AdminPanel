import { Component, OnInit } from '@angular/core';
import { PouchService } from 'src/app/pouch.service';
import { ComponentModule } from '../component/component.module'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {

  pouchService: PouchService;
  
  constructor() {
    this.pouchService = new PouchService();
   }

  ngOnInit() {}

  killme() 
  {
    console.log('kll me');
    const x = this.pouchService.foo();
    console.log(x);
    const y = this.pouchService.fetch();
  }

}
