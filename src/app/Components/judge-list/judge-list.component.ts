import { Component, OnInit } from '@angular/core';
import {PouchService} from "../../pouch-service.service";

@Component({
  selector: 'app-judge-list',
  templateUrl: './judge-list.component.html',
  styleUrls: ['./judge-list.component.scss'],
})
export class JudgeListComponent implements OnInit {

  public judges;
  constructor(private service: PouchService) { }

  ngOnInit() {
    this.judges = this.service.getJudges();
  }

}
