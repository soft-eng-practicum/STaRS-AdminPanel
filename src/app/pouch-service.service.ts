import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import * as PouchDB  from 'pouchdb';


@Injectable({
  providedIn: 'root'
})
export class PouchService {
  constructor () { }

  pouchCall: any;
  mattsList: any = [];
  posterName: any = [];
  advisorName: any = [];
  posterids: any = [];
  posterTitle: any = [];
  resultString: string;
  res:any;
  loading = true; //Don't know what this does... looks important?
  contactsTest: any = [];
  posterkey:any;
  objectResults:any = [];

  //pouchJudges: any;
  //pouchPosters: any;
  //globalUser: any;
  //globalUserDoc: any;
  //posters: any = [];
  //password: any = [];
  //surveyQuestions: any = [];
  //judgeSurveys: any;
  
  getPoster(){
    var PouchDB = require('pouchdb').default;
    this.pouchCall = new PouchDB('http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/stars2019/');
    this.pouchCall.get("configuration").then(resultString => {

      // This returns arrays within an array
      this.res = resultString.posters.split('\n');
      for (let index = 0; index < this.res.length; index++) {
        //console.log(this.res[index]); //testing
        this.mattsList.push(this.res[index].split(','));
      } // Don't touch the above part!
      

      console.log(this.mattsList);
      
      // Starting from 1 to remove the "id" header
      for (let index = 1; index < this.mattsList.length; index++) {      //array[index][number] array inside an array 
        this.posterids.push(this.mattsList[index][1]); 
        this.posterTitle.push(this.mattsList[index][2]);
        this.posterName.push(this.mattsList[index][4]);
        this.advisorName.push(this.mattsList[index][5]);
      }
      
      // Don't know why... but I had to seperate the loops
      for (let index = 0; index < this.posterids.length; index++) {
        this.objectResults.push(
          {
            ID : this.posterids[index].toString(), 
            Poster : this.posterName[index].toString(),
            Title : this.posterTitle[index].toString(),
            Advisor : this.advisorName[index].toString()
          }
        );
      }


    });

    return this.objectResults;
  };

}
