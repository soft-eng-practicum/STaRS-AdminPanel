import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import * as PouchDB  from 'pouchdb';


@Injectable({
  providedIn: 'root'
})
export class PouchService {

  private localDB: any;
  private pouchDB = require('pouchdb').default;
  private couchCallPosters: any;
  private posterDBResults;
  private starter: any;
  private opts: any = {
    live: true,
    retry: true,
    continuous: true,
    back_off_function: function (delay) {
        if (delay === 0) {
            return 1000;
        }
        return delay * 3;
    }
};

  constructor() {
    const pouchDB = require('pouchdb').default;
    this.localDB = new pouchDB('localPouchDB');
    this.couchCallPosters = new pouchDB('http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/stars2020posters/', this.opts);
    this.localDB.sync(this.couchCallPosters);
    this.posterDBResults = [];
    this.starter = this.getAll();
  }


  public getPosters(): any{
    return this.posterDBResults;
  }

  private async getAll(){
    let x: any;
    await this.localDB.allDocs({
      include_docs: true,
      attachments: true
    }).then((result) => {
      x = result;
    });

    for (let i = 0; i < x.total_rows; i++) {
      this.posterDBResults.push(
      {
        ID: x.rows[i].doc['_id'],
        Title: x.rows[i].doc['Poster Title'],
        Students: x.rows[i].doc['Student Authors'],
        Advisors: x.rows[i].doc['Advisors']
      });
    }
    await this.posterDBResults;
  }

}
