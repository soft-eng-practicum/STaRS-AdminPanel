import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import * as PouchDB  from 'pouchdb';
import { IfStmt } from '@angular/compiler';
import { ITS_JUST_ANGULAR } from '@angular/core/src/r3_symbols';

//this is all functional but needs to be refactored

@Injectable({
  providedIn: 'root'
})
export class PouchService {

  private localPosterDB: any;
  private localJudgeDB: any;
  private pouchDB = require('pouchdb').default;
  private couchCallPosters: any;
  private couchCallJudges: any;
  private posterDBResults;
  private starter: any;
  private judgeDBResults;
  private
   opts: any = {
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
    this.localPosterDB = new pouchDB('localPouchDB');
    this.localJudgeDB = new pouchDB('localJudgeDB');
    this.couchCallPosters = new pouchDB('http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/stars2020posters/', this.opts);
    this.couchCallJudges = new pouchDB('http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/judges/', this.opts);
    this.localPosterDB.sync(this.couchCallPosters);
    this.localJudgeDB.sync(this.couchCallJudges);
    this.posterDBResults = [];
    this.judgeDBResults = [];
    this.starter = this.getAllPosters();
  }

  //used for forced syncing when page accessed
  public sync(){
    this.localPosterDB.sync(this.couchCallPosters);
    //this.addDoc();
    this.posterDBResults = [];
    this.starter = this.getAllPosters();
  }

  public getPosters(): any{
    return this.posterDBResults;
  }

  private async getAllPosters(){
    let x: any;
    await this.localPosterDB.allDocs({
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
        Advisors: x.rows[i].doc['Advisors'],
        CountJudges: await this.getSurveyByJudgeCount(x.rows[i].doc['_id']),
        Score: await this.getResultByJudgeScore(x.rows[i].doc['_id'])
      });
    }
    await this.posterDBResults;
  }

  private async getSurveyByJudgeCount(groupID: number){
    let resultSet: any;
    await this.localJudgeDB.allDocs({
      include_docs: true,
      attachments: true
    }).then((result) => {
      resultSet = result;
    });

    //scan logged surveys for count with group id
    let surveyTotal = 0;
    for (let i = 0; i < resultSet.total_rows; i++) {
        if(resultSet.rows[i].doc['surveys'])
        {
          let y = resultSet.rows[i].doc['surveys'].length;
          for (let j = 0; j < resultSet.rows[i].doc['surveys'].length; j++) {
          if(resultSet.rows[i].doc['surveys'][j].groupId == groupID) {
            surveyTotal++;
          }
        }
      }
    }
    return surveyTotal;
  }

  private async getResultByJudgeScore(groupID: number){
    let resultSet: any;
    await this.localJudgeDB.allDocs({
      include_docs: true,
      attachments: true
    }).then((result) => {
      resultSet = result;
    });

    let surveyTotal = 0;
    let surveyCount = 0;
    for (let i = 0; i < resultSet.total_rows; i++) {
        if(resultSet.rows[i].doc['surveys'])
        {
          for (let j = 0; j < resultSet.rows[i].doc['surveys'].length; j++) {
            if(resultSet.rows[i].doc['surveys'][j].groupId == groupID) {
              resultSet.rows[i].doc['surveys'][j]['answers'].forEach(element => {
                if(!isNaN(element))
                surveyTotal += Number(element)
                surveyCount++;
              });
            }
        }
      }
    }
    //returns average score
    return (surveyTotal/surveyCount);
  }

  private addDoc()
  {
    //This is a method only for testing. Should be removed from final product
    let doc = {
    '_id': '77',
    'Advisors': ['Senor Dagnan'],
    'Disciplines(s)': ['Disintegration'],
    'Email Address': 'me@myself.i',
    'Poster Title': 'Where Did My Hair Go: The Wonder of Baldness',
    'Student Authors': ['Senor Greg'],
    'Supervisor Email': ['Senor Advisor']
    }

    //if can't connect to remote, put doc in local db
    if(!this.couchCallPosters.put(doc))
    {
      this.localPosterDB.put(doc)
    }
  }

  public getJudges(): any{
    return this.judgeDBResults;
  }

  private async getAll() {
    let x: any;
    await this.localJudgeDB.allDocs({
      include_docs: true,
      attachments: true
    }).then((result) => {
      x = result;
    });
    // Fetch Poster results
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
    await this.posterDBResults;
    // Fetch Judge results
    for (let i = 0; i < x.total_rows; i++) {
      this.judgeDBResults.push({
        JID: x.rows[i].doc._id, // might conflict with ID from posters? Rename if necessary
        Username: x.rows[i].doc.username,
        // NumOfSurveys - genrate in webpage?
        GroupsSurveyed: x.rows[i].doc.surveys_assigned
      });
    }
  }
}
