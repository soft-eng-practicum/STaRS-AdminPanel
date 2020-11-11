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
  private jLocalDB: any;
  private pouchDB = require('pouchdb').default;
  private couchCallPosters: any;
  private couchCallJudges: any;
  private posterDBResults;
  private judgeDBResults;
  private starter: any;
  private opts: any = {
    live: true,
    retry: true,
    continuous: true,
    back_off_function(delay) {
        if (delay === 0) {
            return 1000;
        }
        return delay * 3;
    }
};

  constructor() {
    const pouchDB = require('pouchdb').default;
    this.localDB = new pouchDB('localPouchDB');
    this.jLocalDB = new pouchDB('jLocalPouchDB');
    this.couchCallPosters = new pouchDB('http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/stars2020posters/', this.opts);
    this.couchCallJudges = new pouchDB('http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/stars2020judges/', this.opts);
    this.localDB.sync(this.couchCallPosters);
    this.jLocalDB.sync(this.couchCallJudges);
    this.posterDBResults = [];
    this.judgeDBResults = [];
    this.starter = this.getAll();
  }


  public getPosters(): any{
    return this.posterDBResults;
  }

  public getJudges(): any{
    return this.judgeDBResults;
  }

  private async getAll(){
    let x: any; // index for posters
    let y: any; // index for judges
    await this.localDB.allDocs({
      include_docs: true,
      attachments: true
    }).then((result) => {
      x = result;
    });
    await this.jLocalDB.allDocs({
      include_docs: true,
      attachments: true
    }).then((result) => {
      y = result;
    });
    // Fetch Poster results
    console.log('Parsing posters...');
    console.log('Row size: ' + x.total_rows);
    for (let i = 0; i < x.total_rows; i++) {
      console.log('Poster loop '  + i);
      this.posterDBResults.push(
      {
        ID: x.rows[i].doc._id,
        Title: x.rows[i].doc['Poster Title'],
        Discipline: x.rows[i].doc['Discipline(s)'],
        Students: x.rows[i].doc['Student Authors'],
        Advisors: x.rows[i].doc.Advisors
      });
    }
    console.log('Finished loading posters');
    await this.posterDBResults;
    await this.localDB.allDocs({
      include_docs: true,
      attachments: true
    }).then((result) => {
      x = result;
    });
    // Fetch Judge results
    console.log('Parsing judges...');
    console.log('Row size: ' + y.total_rows);
    // TODO:x.total_rows below is returning 0?
    for (let j = 0; j < y.total_rows; j++) {
      console.log('Judge loop ' + j);
      if (y.rows[j].doc.Advisors == null){ // The judge DB also contains posters. This should filter out the posters.
        this.judgeDBResults.push({
          JID: y.rows[j].doc._id,
          Username: y.rows[j].doc.username,
          SurveyLength: 'dummy value ' + j,
          // Find out how to get the size of a field
          // GroupsSurveyed: [] = x.rows[j].doc['surveys_assigned']
          // Above line causes problem, loop never exits
        });
    }
    }
    console.log('Finished loading judges');
    await this.judgeDBResults;
  }
}
