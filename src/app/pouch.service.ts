import { EventEmitter, Injectable } from '@angular/core';
import PouchDB from '../../node_modules/pouchdb';


@Injectable({
  providedIn: 'root'
})
export class PouchService 
{
    private isInstantiated: boolean;
    private database: any;
    private listener: EventEmitter<any> = new EventEmitter();
    password: any = [];
    remote: any;
    
    public constructor() 
    {
        let opts = {
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
        
        fetch('../../assets/data/couch_connection.json')
        .then(res => res.json())
        .then(json => {
        this.password = json;
        this.remote = this.init();
        });
        
        if(!this.isInstantiated) 
        {
            this.database = new PouchDB('localDB');
            this.isInstantiated = true;
        }
        
    }

    public fetch() {
        return this.database.allDocs({include_docs: true});
    }
 
    public init() 
    { 
        let remotteDatabase = new PouchDB('http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/judges_sp19_3');
       
        return remotteDatabase;
    }
 
    public foo()
    {
        const y = this.database.sync(this.remote);
        return this.database;
    }

    public get(id: string) 
    { 
        return this.database;
    }
 
    
    public put(id: string, document: any) 
    {
        document._id = id;
        return this.get(id).then(result => {
            document._rev = result._rev;
            return this.database.put(document);
        }, error => {
            if(error.status == "404") {
                return this.database.put(document);
            } else {
                return new Promise((resolve, reject) => {
                    reject(error);
                });
            }
        });
    }

    public sync(remote: string) 
    {
        let remoteDatabase = new PouchDB(remote);
        this.database.sync(remoteDatabase, {
            live: true
        }).on('change', (change: any) => {
            this.listener.emit(change);
        });
    }
 
    public getChangeListener() 
    {
        return this.listener;
    }
}


//   pouch: any;
//   database: any;
//   remoteDB: any;
//   confPouch: any;
//   $q: any;

//   constructor($rootScope, pouchDB, $q, $pouchdb) {
//     this.pouch = $pouchdb.retryReplication();
//     this.database = $pouchdb.localDB;
//     this.remoteDB = $pouchdb.remoteDB;
//     this.confPouch = $pouchdb.confDB;
//     this.$q = $q;
//   }

//      getUsers() {
//         var deferred = this.$q.defer();
//         this.database.allDocs({
//             include_docs: true,
//             attachments: true
//         }).then(function (res) {
//             deferred.resolve(res.rows);
//         }).catch(function (err) {
//             console.log(err);
//             deferred.reject(err);
//         });
//         return deferred.promise;
//     };

//      login(username, password) {
//         var deferred = this.$q.defer();
//         this.database.allDocs({
//             include_docs: true,
//             attachments: true
//         }).then(function (res) {
//             res.rows.forEach(function (row) {
//                 // if (angular.equals(row.doc.username, username) && angular.equals(row.doc.password, password)) {
//                 //     deferred.resolve(row.doc);
//                 // }
//             });
//         }).catch(function (err) {
//             deferred.reject(err);
//         });
//         return deferred.promise;
//     };

//     getJudge(id) {
//         console.log('getJudge');
//         var deferred = this.$q.defer();
//         this.database.get(id).then(function (doc) {
//             //console.log(doc);
//             deferred.resolve(doc);
//         }).catch(function (err) {
//             deferred.reject(err);
//             console.log(err);
//         });
//         return deferred.promise;
//     };

//     getGroupSurveys(groupId) {
//         var deferred = this.$q.defer();
//         var result = [];
//         this.database.allDocs({
//             include_docs: true,
//             attachments: true
//         }).then(function (res) {
//             if (res.rows.length) {
//                 res.rows.forEach(function (row) {
//                     if (row.doc.surveys) {
//                         row.doc.surveys.forEach(function (survey) {
//                             if (survey.groupId === groupId) {
//                                 var resultObj = {};
//                                 // resultObj.judgeName = row.doc.username;
//                                 // resultObj.answers = survey.answers;
//                                 result.push(resultObj);
//                             }
//                         });
//                     }

//                 });
//             }

//             deferred.resolve(result);
//         }).catch(function (err) {
//             deferred.reject(err);
//         });
//         return deferred.promise;
//     };

//     countCompletedSurveys(id) {
//         var deferred = this.$q.defer();
//         var result = [];
//         this.database.allDocs({
//             include_docs: true,
//             attachments: true
//         }).then(function (res) {
//             if (res.rows.length) {
//                 res.rows.forEach(function (row) {
//                     if (row.doc.surveys) {
//                         for (var i = 0; i < row.doc.surveys.length; i++) {
//                             if (row.doc.surveys[i].groupId == id) {
//                                 result.push(row.doc.username);
//                             }
//                         }
//                     }
//                 });
//                 deferred.resolve(result);
//             }
//         }).catch(function (err) {
//             deferred.reject(err);
//             console.log(err);
//         });
//         return deferred.promise;
//     };

//     getAllSurveys() {
//         var deferred = this.$q.defer();
//         this.database.allDocs({
//             include_docs: true,
//             attachments: true
//         }).then(function (res) {
//             deferred.resolve(res);
//         }).catch(function (err) {
//             deferred.reject(err);
//         });
//         return deferred.promise;
//     };

//     getJudges() {
//         var deferred = this.$q.defer();
//         this.database.allDocs({
//             include_docs: true,
//             attachments: true
//         }).then(function (res) {
//             var judges = [];
//             res.rows.forEach(function (row) {
//                 var doc = {
//                     id: '',
//                     name: '',
//                     surveys: [],
//                     surveyLength: 0,
//                     groupsSurveyed: []
//                 };
//                 doc.id = row.id;
//                 doc.name = row.doc.username;
//                 if (row.doc.surveys) {
//                     doc.surveys = row.doc.surveys;
//                     doc.surveyLength = row.doc.surveys.length;
//                     row.doc.surveys.forEach(function (survey) {
//                       doc.groupsSurveyed.push({'id': survey.groupId, 'name': survey.groupName});
//                     });
//                 }

//                 judges.push(doc);
//             });
//             deferred.resolve(judges);
//         }).catch(function (err) {
//             deferred.reject(err);
//         });
//         return deferred.promise;
//     };

//   avgSumScores(judges) {
//     console.log(judges);
//     var avgResults = judges[0].answers.slice(0);
//     avgResults.fill(0);

//     // Average and sum judge scores
//     judges.forEach(function (doc) {
//       for (var i in doc.answers) {
//         avgResults[i] = avgResults[i] + parseInt(doc.answers[i]);
//       }
//     });
//     // Divide by number of judges
//     for (var i in avgResults) {
//       // avgResults[i] = avgResults[i] / $scope.judges.length;
//     }
//     return avgResults.reduce((num, val) => { return num + val; }, 0);
//   }

  // getConf(){
  //       pouchService = this;
  //       confPouch.get("configuration").then(function (res) {
  //           console.log("Conf docs read.");
  //           $pouchdb.configuration = res;

  //           console.log("Populating posters");

  //           // go through poster CSV data and populate a JSON structure
  //           posterRows = $pouchdb.configuration.posters.split(/\n/);
  //           titles = posterRows.shift().split(/,/);
  //           posterIndex = 0;
  //           $pouchdb.posters = [];
  //           posterRows.forEach(function (row) {
  //               rowList = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
  //               $pouchdb.posters[posterIndex] = {
  //                   "email": rowList[0],
  //                   "id": rowList[1],
  //                   "judges": [],
  //                   "countJudges": 0,
  //                   "group": rowList[2],
  //                   "subject": rowList[3],
  //                   "students": rowList[4],
  //                   "advisor": rowList[5],
  //                   "advisorEmail": rowList[6]
  //               };
  //               posterIndex++;
  //           });
  //           $pouchdb.posters.forEach(function (poster) {
  //               pouchService.countCompletedSurveys(poster.id).then(function (res) {
  //                 poster.countJudges = res.length;
  //                 poster.judges = res;

  //                 // calculate summed average scores
  //                 poster.score = 0; // pouchService.avgSumScores(res); not ready yet
  //               });
  //           });
  //       });

  //   }
