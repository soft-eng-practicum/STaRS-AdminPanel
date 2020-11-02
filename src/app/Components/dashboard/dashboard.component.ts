import { Component, OnInit } from '@angular/core';
import { ComponentModule } from '../component/component.module';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {


  constructor() {
   }

  ngOnInit() {}

  killme()
  {
    console.log('kll me');
  }

}
