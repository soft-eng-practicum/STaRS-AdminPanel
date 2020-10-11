import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PouchService {

  // constructor($rootScope, pouchDB, $q, $pouchdb) {
  //   var pouch = $pouchdb.retryReplication();
  //   var database = $pouchdb.localDB;
  //   var remoteDB = $pouchdb.remoteDB;
  //   var confPouch = $pouchdb.confDB;


  //   this.getUsers(): {
  //       var deferred = $q.defer();
  //       database.allDocs({
  //           include_docs: true,
  //           attachments: true
  //       }).then(function (res) {
  //           deferred.resolve(res.rows);
  //       }).catch(function (err) {
  //           console.log(err);
  //           deferred.reject(err);
  //       });
  //       return deferred.promise;
  //   };

  //   this.login = function (username, password) {
  //       var deferred = $q.defer();
  //       database.allDocs({
  //           include_docs: true,
  //           attachments: true
  //       }).then(function (res) {
  //           res.rows.forEach(function (row) {
  //               if (angular.equals(row.doc.username, username) && angular.equals(row.doc.password, password)) {
  //                   deferred.resolve(row.doc);
  //               }
  //           });
  //       }).catch(function (err) {
  //           deferred.reject(err);
  //       });
  //       return deferred.promise;
  //   };

  //   this.getJudge = function (id) {
  //       console.log('getJudge');
  //       var deferred = $q.defer();
  //       database.get(id).then(function (doc) {
  //           //console.log(doc);
  //           deferred.resolve(doc);
  //       }).catch(function (err) {
  //           deferred.reject(err);
  //           console.log(err);
  //       });
  //       return deferred.promise;
  //   };

  //   this.getGroupSurveys = function (groupId) {
  //       var deferred = $q.defer();
  //       var result = [];
  //       database.allDocs({
  //           include_docs: true,
  //           attachments: true
  //       }).then(function (res) {
  //           if (res.rows.length) {
  //               res.rows.forEach(function (row) {
  //                   if (row.doc.surveys) {
  //                       row.doc.surveys.forEach(function (survey) {
  //                           if (survey.groupId === groupId) {
  //                               var resultObj = {};
  //                               resultObj.judgeName = row.doc.username;
  //                               resultObj.answers = survey.answers;
  //                               result.push(resultObj);
  //                           }
  //                       });
  //                   }

  //               });
  //           }

  //           deferred.resolve(result);
  //       }).catch(function (err) {
  //           deferred.reject(err);
  //       });
  //       return deferred.promise;
  //   };

  //   this.countCompletedSurveys = function (id) {
  //       var deferred = $q.defer();
  //       var result = [];
  //       database.allDocs({
  //           include_docs: true,
  //           attachments: true
  //       }).then(function (res) {
  //           if (res.rows.length) {
  //               res.rows.forEach(function (row) {
  //                   if (row.doc.surveys) {
  //                       for (var i = 0; i < row.doc.surveys.length; i++) {
  //                           if (row.doc.surveys[i].groupId == id) {
  //                               result.push(row.doc.username);
  //                           }
  //                       }
  //                   }
  //               });
  //               deferred.resolve(result);
  //           }
  //       }).catch(function (err) {
  //           deferred.reject(err);
  //           console.log(err);
  //       });
  //       return deferred.promise;
  //   };

  //   this.getAllSurveys = function () {
  //       var deferred = $q.defer();
  //       database.allDocs({
  //           include_docs: true,
  //           attachments: true
  //       }).then(function (res) {
  //           deferred.resolve(res);
  //       }).catch(function (err) {
  //           deferred.reject(err);
  //       });
  //       return deferred.promise;
  //   };

  //   this.getJudges = function () {
  //       var deferred = $q.defer();
  //       database.allDocs({
  //           include_docs: true,
  //           attachments: true
  //       }).then(function (res) {
  //           var judges = [];
  //           res.rows.forEach(function (row) {
  //               var doc = {
  //                   id: '',
  //                   name: '',
  //                   surveys: [],
  //                   surveyLength: 0,
  //                   groupsSurveyed: []
  //               };
  //               doc.id = row.id;
  //               doc.name = row.doc.username;
  //               if (row.doc.surveys) {
  //                   doc.surveys = row.doc.surveys;
  //                   doc.surveyLength = row.doc.surveys.length;
  //                   row.doc.surveys.forEach(function (survey) {
  //                     doc.groupsSurveyed.push({'id': survey.groupId, 'name': survey.groupName});
  //                   });
  //               }

  //               judges.push(doc);
  //           });
  //           deferred.resolve(judges);
  //       }).catch(function (err) {
  //           deferred.reject(err);
  //       });
  //       return deferred.promise;
  //   };

  // this.avgSumScores = function (judges) {
  //   console.log(judges);
  //   var avgResults = judges[0].answers.slice(0);
  //   avgResults.fill(0);

  //   // Average and sum judge scores
  //   judges.forEach(function (doc) {
  //     for (i in doc.answers) {
  //       avgResults[i] = avgResults[i] + parseInt(doc.answers[i]);
  //     }
  //   });
  //   // Divide by number of judges
  //   for (i in avgResults) {
  //     avgResults[i] = avgResults[i] / $scope.judges.length;
  //   }
  //   return avgResults.reduce((num, val) => { return num + val; }, 0);
  // }

  //   this.getConf = function(){
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
   //}
}
