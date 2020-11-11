import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import * as PouchDB  from 'pouchdb';
import {log} from "util";


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
    // Fetch Judge results
    console.log('Parsing judges...');
    console.log('Row size: ' + y.total_rows);
    for (let j = 0; j < y.total_rows; j++) {
      if (y.rows[j].doc.Advisors == null){ // The judge DB also contains posters. This should filter out the posters.
        let tempGroup = '';
        for (let k = 0; k < y.rows[j].doc.surveys_assigned.length; k++){ // parse info for "Groups surveyed"
          tempGroup += 'Group ID ' + y.rows[j].doc.surveys_assigned[k].groupId + ': ';
          tempGroup += y.rows[j].doc.surveys_assigned[k].groupName + ' | ';
        }
        this.judgeDBResults.push({
          JID: y.rows[j].doc._id,
          Username: y.rows[j].doc.username,
          Surveys: y.rows[j].doc.surveys_assigned, // unused but would be useful if I knew how attachments worked
          SurveyLength: y.rows[j].doc.surveys_assigned.length,
          GroupsSurveyed: tempGroup
        });
      }
    }
    console.log('Finished loading judges');
    await this.judgeDBResults;
  }
}
