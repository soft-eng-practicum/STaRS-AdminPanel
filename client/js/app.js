var app = angular.module('app', ['ngAnimate', 'toastr', 'ui.router', 'ui.grid', 'ngTouch', 'ui.grid.autoResize', 'ui.grid.exporter', 'ngCookies', 'angular-md5', 'pouchdb', 'toastr']);

/* ==========================================================================
   Config
   ========================================================================== */
/**
 * config: handles application routing and data feed through specific url's
 */
app.config(function ($stateProvider, $urlRouterProvider, toastrConfig) {
    angular.extend(toastrConfig, {
        autoDismiss: false,
        containerId: 'toast-container',
        maxOpened: 1,
        newestOnTop: true,
        positionClass: 'toast-top-right',
        preventDuplicates: false,
        preventOpenDuplicates: true,
        target: 'body'
    });

    $stateProvider.state('home', {
        url: '/',
        controller: 'HomeCtrl',
        templateUrl: 'templates/home.html'
    });
    $stateProvider.state('dashboard', {
        url: '/dashboard',
        controller: 'DashboardCtrl',
        templateUrl: 'templates/dashboard.html'
    });
    $stateProvider.state('finalReport', {
        url: '/finalReport',
        controller: 'FinalReportCtrl',
        templateUrl: 'templates/finalReport.html'
    });
    $stateProvider.state('posterList', {
        url: '/posterList',
        controller: 'PosterListCtrl',
        templateUrl: 'templates/posterList.html'
    });
    $stateProvider.state('judgeList', {
        url: '/judgeList',
        controller: 'JudgeListCtrl',
        templateUrl: 'templates/judgeList.html'
    });
    $stateProvider.state('poster', {
        url: '/poster/{id}',
        controller: 'PosterCtrl',
        templateUrl: 'templates/poster.html',
        resolve: {
            poster: [
                '$stateParams', '$http', '$q', '$pouchdb',
                function ($stateParams, $http, $q, $pouchdb) {
                        var deferred = $q.defer();
                        $pouchdb.posters.forEach(function (poster) {
                            if (poster.id == $stateParams.id) {
                                //console.log(poster);
                                deferred.resolve(poster);
                            }
                        });
                        return deferred.promise;
                    
                }
            ]
        }
    });
    $stateProvider.state('judge', {
        url: '/judge/{id}',
        controller: 'JudgeCtrl',
        templateUrl: 'templates/judge.html',
        resolve: {
            judge: [
                '$stateParams', 'pouchService',
                function ($stateParams, pouchService) {
                    return pouchService.getJudge($stateParams.id);
                }
            ]
        }
    });
    $stateProvider.state('logout', {
        url: '/logout',
        controller: 'LogoutCtrl',
        templateUrl: null
    });
    $urlRouterProvider.otherwise('/');
});

app.service('$pouchdb', function ($rootScope, pouchDB, $http) {
    this.retryReplication = function () {
        var self = this;
        var replicate;
        var status;
        var opts = {
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

        self.localDB = pouchDB('judges_sp21');
        self.localDB.sync('http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/judges_sp21', opts)
            .on('change', function (change) {
                $rootScope.$broadcast('CHANGES in judges');
                console.log('yo something changed');
                console.log(change);
            }).on('paused', function (info) {
                $rootScope.$broadcast('judges paused');
                console.log('PAUSED in judges');
            }).on('active', function (info) {
                console.log(info);
                console.log('ACTIVE in judges');
            }).on('error', function (err) {
                console.log(err);
                console.log('ERROR in judges');
            });

        self.confDB = pouchDB('conf');
        self.confDB.sync("http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/configuration", opts)
            .on('change', function (change) {
                //$rootScope.$broadcast('changes');
                console.log('yo something changed in conf');
                console.log(change);
            }).on('paused', function (info) {
                //$rootScope.$broadcast('paused');
                console.log('PAUSED in conf');
            }).on('active', function (info) {
                console.log(info);
                console.log('ACTIVE in conf');
            }).on('error', function (err) {
                console.log(err);
                console.log('ERROR in conf');
            });

    };
});


/* ==========================================================================
   Services
   ========================================================================== */
/**
 * pouchService: establishes and maintains connection with Couchdb and Pouchdb
 */
app.service('pouchService', function ($rootScope, pouchDB, $q, $pouchdb) {
    var pouch = $pouchdb.retryReplication();
    var database = $pouchdb.localDB;
    var remoteDB = $pouchdb.remoteDB;
    var confPouch = $pouchdb.confDB;


    this.getUsers = function () {
        var deferred = $q.defer();
        database.allDocs({
            include_docs: true,
            attachments: true
        }).then(function (res) {
            deferred.resolve(res.rows);
        }).catch(function (err) {
            console.log(err);
            deferred.reject(err);
        });
        return deferred.promise;
    };

    this.login = function (username, password) {
        var deferred = $q.defer();
        database.allDocs({
            include_docs: true,
            attachments: true
        }).then(function (res) {
            res.rows.forEach(function (row) {
                if (angular.equals(row.doc.username, username) && angular.equals(row.doc.password, password)) {
                    deferred.resolve(row.doc);
                }
            });
        }).catch(function (err) {
            deferred.reject(err);
        });
        return deferred.promise;
    };

    this.getJudge = function (id) {
        console.log('getJudge');
        var deferred = $q.defer();
        database.get(id).then(function (doc) {
            //console.log(doc);
            deferred.resolve(doc);
        }).catch(function (err) {
            deferred.reject(err);
            console.log(err);
        });
        return deferred.promise;
    };

    this.getGroupSurveys = function (groupId) {
        var deferred = $q.defer();
        var result = [];
        database.allDocs({
            include_docs: true,
            attachments: true
        }).then(function (res) {
            if (res.rows.length) {
                res.rows.forEach(function (row) {
                    if (row.doc.surveys) {
                        row.doc.surveys.forEach(function (survey) {
                            if (survey.groupId === groupId) {
                                var resultObj = {};
                                resultObj.judgeName = row.doc.username;
                                resultObj.answers = survey.answers;
                                result.push(resultObj);
                            }
                        });
                    }

                });
            }

            deferred.resolve(result);
        }).catch(function (err) {
            deferred.reject(err);
        });
        return deferred.promise;
    };

    this.countCompletedSurveys = function (id) {
      var deferred = $q.defer();
      var judges = [];
      var results = [];
      
        database.allDocs({
            include_docs: true,
            attachments: true
        }).then(function (res) {
            if (res.rows.length) {
                res.rows.forEach(function (row) {
                    if (row.doc.surveys) {
                        for (var i = 0; i < row.doc.surveys.length; i++) {
                            if (row.doc.surveys[i].groupId == id) {
                              judges.push(row.doc.username);
                              results.push(row.doc.surveys[i].answers);                       
                            }
                        }
                    }
                });
              deferred.resolve({"judge_names": judges, "judge_reports": results});
            }
        }).catch(function (err) {
            deferred.reject(err);
            console.log(err);
        });
        return deferred.promise;
    };

    this.getAllSurveys = function () {
        var deferred = $q.defer();
        database.allDocs({
            include_docs: true,
            attachments: true
        }).then(function (res) {
            deferred.resolve(res);
        }).catch(function (err) {
            deferred.reject(err);
        });
        return deferred.promise;
    };

    this.getJudges = function () {
        var deferred = $q.defer();
        database.allDocs({
            include_docs: true,
            attachments: true
        }).then(function (res) {
            var judges = [];
            res.rows.forEach(function (row) {
                var doc = {
                    id: '',
                    name: '',
                    surveys: [],
                    surveyLength: 0,
                    groupsSurveyed: []
                };
                doc.id = row.id;
                doc.name = row.doc.username;
                if (row.doc.surveys) {
                    doc.surveys = row.doc.surveys;
                    doc.surveyLength = row.doc.surveys.length;
                    row.doc.surveys.forEach(function (survey) {
                      doc.groupsSurveyed.push({'id': survey.groupId, 'name': survey.groupName});
                    });
                }

                judges.push(doc);
            });
            deferred.resolve(judges);
        }).catch(function (err) {
            deferred.reject(err);
        });
        return deferred.promise;
    };

  this.avgSumScores = function (poster_reports) {
    var avgResults = 0;
    
    // Average and sum judge scores
    poster_reports.forEach(function (doc) {
      for (i in doc) {
        num = parseInt(doc[i]);
        if (i < 6 && num > 0)
          avgResults = avgResults + num;
      }
    });
    // Divide by number of judges
    if (poster_reports.length > 0) 
      avgResults = avgResults / poster_reports.length;

    // Return only two decimal digits
    return Math.round(avgResults * 100)/100;
  }
  
    this.getConf = function(){
        pouchService = this;
        confPouch.get("stars2021").then(function (res) {
            console.log("Conf docs read.");
            $pouchdb.configuration = res;

            console.log("Populating posters");

          // check if a pre-made JSON object exists
          if ("posters_json" in $pouchdb.configuration)
            $pouchdb.posters = $pouchdb.configuration.posters_json;
          else {
            // go through poster CSV data and populate a JSON structure
            posterRows = $pouchdb.configuration.posters.split(/\n/);
            titles = posterRows.shift().split(/,/);
            posterIndex = 0;
            $pouchdb.posters = [];
            posterRows.forEach(function (row) {
                rowList = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                $pouchdb.posters[posterIndex] = {
                    "email": rowList[0],
                    "id": parseInt(rowList[1]),
                    "judges": [],
                    "countJudges": 0,
                    "group": rowList[2],
                    "subject": rowList[3],
                    "students": rowList[4],
                    "advisor": rowList[5],
                    "advisorEmail": rowList[6]
                };
                posterIndex++;
            });
          }
          $pouchdb.posters.forEach(function (poster) {
            pouchService.countCompletedSurveys(poster.id).then(function (res) {
              poster.countJudges = res.judge_names.length;
              poster.judges = res.judge_names;

              // calculate summed average scores
              poster.score = pouchService.avgSumScores(res.judge_reports); // not ready yet
            });
          });
        });
        
    }

});

/**
 * $service: functions to maintain user state and to extract and update the data from Couchdb
 */
app.factory('$service', function ($http, $q, md5, $rootScope, pouchService) {
    return {
        getQuestions: function () {
            return $http.get('./survey.json');
        },
        getPoster: function () {
            return $http.get('http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/stars2019/configuration');
        }
    };
});

/* ==========================================================================
   Controllers
   ========================================================================== */
/**
 * NavbarCtrl: controller for the navbar (header)
 */
app.controller('NavbarCtrl', function ($rootScope, $scope, toastr) {
    $rootScope.isAuth = false;

});

/**
 * HomeCtrl: controller for the login page (initial page)
 */
app.controller('HomeCtrl', function ($http, $scope, $cookies, $pouchdb, pouchService, $service, $rootScope, $timeout, $state, toastr) {
    var pouch = $pouchdb.retryReplication();
    var localPouch = $pouchdb.localDB;
    pouchService.getConf();

    $rootScope.isAuth = false;

    $scope.items = [];
    $scope.user = {};
    $scope.search = {};

    $scope.test = function () {
        $http.get('/api').success(function (res) {
            console.log(res);
        });
    };

    $scope.getItems = function () {
        pouchService.getUsers()
            .then(
                function (res) {
                    res.forEach(function (row) {
                        var item = { name: row.doc.username };
                        $scope.items.push(item);
                    });
                },
                function (err) {
                    console.log(err);
                }
            );
    };

    $scope.getItems();


    $scope.updateSelection = function (name) {
        $('#active').focus();
        $scope.user.username = name;
    };


    $scope.submitForm = function (user) {
        pouchService.login(user.username, user.password)
            .then(
                function (res) {
                    $cookies.put('user', res._id);
                    $rootScope.isAuth = true;
                    $state.go('dashboard');
                    toastr.success('You are now logged in!');
                },
                function (err) {
                    toastr.error('Invalid login credientials');
                    return;
                }
            );
    };
});

/**
 * DashboardCtrl: controller for the main page
 */
app.controller('DashboardCtrl', function ($scope, pouchService, $service, $cookies, $rootScope, $state, $pouchdb) {
    var pouch = $pouchdb.retryReplication();
    var localPouch = $pouchdb.localDB;
    var remoteDB = $pouchdb.remoteDB;
    pouchService.getConf();

    $scope.items = [];

    $scope.getJudges = function () {
        pouchService.getUsers().then(function (res) {
            res.forEach(function (doc) {
                var document = {};
                document.id = doc.id;
                document.username = doc.username;
                document.surveys = doc.surveys;
                $scope.items.push(document);
            });
        }).catch(function (err) {
            console.log(err);
        });
    };

    $scope.getJudges();

});

/**
 * PosterListCtrl: controller for the template that lists all of the posters
 */
app.controller('PosterListCtrl', function ($scope, $service, $cookies, $rootScope, $state, pouchService, $pouchdb) {
    var pouch = $pouchdb.retryReplication();
    var localPouch = $pouchdb.localDB;
    var remoteDB = $pouchdb.remoteDB;
    pouchService.getConf();     // this will fetch the poster list

    $scope.posters = $pouchdb.posters;
    $scope.search = {};
    $scope.orderField = 'score';
    $scope.orderReverse = 1;
});

/**
 * PosterCtrl: controller for the template that displays an individual poster
 */
app.controller('PosterCtrl', function ($scope, poster, uiGridConstants, $cookies, $rootScope, $service, $pouchdb, toastr, $timeout, $state, pouchService, $http, uiGridExporterService, uiGridExporterConstants) {
    var pouch = $pouchdb.retryReplication();
    var localPouch = $pouchdb.localDB;
    var remoteDB = $pouchdb.remoteDB;
    $scope.poster = poster;
    $scope.judges = [];
    $scope.questions = [];
    $scope.loading = true;

    // Email destination addresses
    $scope.emailDest = $scope.poster.students + " <" 
      + $scope.poster.email + ">, "
      + $scope.poster.advisor + " <" + $scope.poster.advisorEmail + ">";

    pouchService.getConf();

    $service.getQuestions().then(function (res) {
        $scope.questions = res.data.questions;
    });
  
    $scope.gridOptions = {
        enableColumnMenus: false,
        enableGridMenu: false,
        enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
        enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
        showColumnFooter: true,
      columnDefs: [
        { field: "name", name: "Judge Name", width: 100,
          "cellTemplate": '<div class="ui-grid-cell-contents">' +
          '<a ui-sref="judge({id: \'{{grid.getCellValue(row, col)}}\' })">{{grid.getCellValue(row, col)}}</a></div>'
        },
        { field: "answers[0]", name: "Statement of Problem", width: 100,
          aggregationType: uiGridConstants.aggregationTypes.avg, aggregationHideLabel: true,
          footerCellFilter: 'fixed2' },
        { field: "answers[1]", name: "Methodology", width: 100,
          aggregationType: uiGridConstants.aggregationTypes.avg, aggregationHideLabel: true,
          footerCellFilter: 'fixed2' },
        { field: "answers[2]", name: "Results/Solution", width: 100,
          aggregationType: uiGridConstants.aggregationTypes.avg, aggregationHideLabel: true,
          footerCellFilter: 'fixed2' },
        { field: "answers[3]", name: "Oral Presentation", width: 100,
          aggregationType: uiGridConstants.aggregationTypes.avg, aggregationHideLabel: true,
          footerCellFilter: 'fixed2' },
        { field: "answers[4]", name: "Poster Layout", width: 100,
          aggregationType: uiGridConstants.aggregationTypes.avg, aggregationHideLabel: true,
          footerCellFilter: 'fixed2' },
        { field: "answers[5]", name: "Impact", width: 100,
          aggregationType: uiGridConstants.aggregationTypes.avg, aggregationHideLabel: true,
          footerCellFilter: 'fixed2' },
        { field: "answers[7]", name: "Total", width: 100,
          aggregationType: uiGridConstants.aggregationTypes.avg, aggregationHideLabel: true,
          footerCellFilter: 'fixed2' },
        {
          field: "answers[6]",
          name: "Additional Comments",
          width: '*',
          "cellTooltip": true
        }
      ],
        exporterCsvFilename: 'PosterResults.csv',
        exporterPdfDefaultStyle: { fontSize: 9 },
        exporterPdfTableStyle: { margin: [30, 30, 30, 30] },
        exporterPdfTableHeaderStyle: { fontSize: 8, bold: true, italics: true, color: '#000000' },
        exporterPdfHeader: {
            text: "GGC STaRS - Poster Report for " + $scope.poster.group + " / Students: " + $scope.poster.students,
            style: { fontSize: 14, alignment: 'center', bold: true }
        },
        exporterPdfFooter: function (currentPage, pageCount) {
            return { text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle' };
        },
        exporterPdfCustomFormatter: function (docDefinition) {
            docDefinition.styles.headerStyle = { fontSize: 22, bold: true };
            docDefinition.styles.footerStyle = { fontSize: 10, bold: true };
            return docDefinition;
        },
        exporterPdfOrientation: 'landscape',
        exporterPdfPageSize: 'LETTER',
        exporterPdfMaxGridWidth: 500,
        exporterCsvLinkElement: angular.element(document.querySelectorAll(".poster-csv-location")),
        onRegisterApi: function (gridApi) {
            $scope.gridApi = gridApi;
        }
    };

    pouchService.getGroupSurveys($scope.poster.id)
        .then(
          function (res) {
            // Nothing to do, return
            if (res.length < 1) { return; }

            // Initialize average results
            var avgResults = res[0].answers.slice(0);
            avgResults.fill(0);
            
            // Transfer judge data
            res.forEach(function (doc) {
              var judge = {};
              judge.name = doc.judgeName;
              total = 0;
              for (i in doc.answers) {
                avgResults[i] = avgResults[i] + parseInt(doc.answers[i]);
                num = parseInt(doc.answers[i]);
                if (i < 6 && num > 0)
                  total = total + num;
              }
              if (doc.answers.length < 7) // if comments missing, add empty
                doc.answers.push("");
              doc.answers.push(total); // add a total column
              judge.answers = doc.answers;
              $scope.judges.push(judge);
            });
            // add a summary line
            for (i in avgResults) {
              avgResults[i] = avgResults[i] / $scope.judges.length;
            }
            // TODO: don't add summary to judges list, but just to data?
            var summary = {};
            summary.name = "Average";
            avgResults[6] = 'Average of ' + $scope.judges.length + ' submissions.'; 
            summary.answers = avgResults;
            //$scope.judges.push(summary);
            // no need anymore since ui-grid is adding the footer            
            
            $scope.gridOptions.data = $scope.judges;
          },
          function (err) {
            toastr.error('There was an error retrieving the poster information');
            console.log(err);
          }
        );

    $scope.export = function () {
        if ($scope.export_format == 'csv') {
            var myElement = angular.element(document.querySelectorAll(".poster-csv-location"));
            $scope.gridApi.exporter.csvExport('all', 'all');
        } else if ($scope.export_format == 'pdf') {
            $scope.gridApi.exporter.pdfExport('all', 'all');
        }
    };

  // Not used
  $scope.emailConfirmFunc = function () {
    toastr.warning('You are about to send an anonymous summary email to ' + $scope.emailDest, 'Are you sure?');
  }
  
  // Send email to student and advisor with feedback information
  $scope.email = function () {
    // close the modal first
    $('#emailConfirmModal').modal('hide');
    
    // Could not format this into an email
    //var CSVtable = angular.element(document.querySelectorAll(".grid"))[0];

    // Remove judge name column for anonymity
    var grid = $scope.gridApi.grid;
    var judgeColumn = grid.columns[0];
    judgeColumn.hideColumn();
    $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
    
    // Body of email
    var message = `
Dear authors,

Please see attached CSV (Excel) file for your judging results of your poster below at the STaRS 2019 event.

Poster information:

Author(s): ${$scope.poster.students}
Advisor(s): ${$scope.poster.advisor}
Title: ${$scope.poster.group}

We had ${$pouchdb.posters.length} posters judged at the event. Your poster was scored by ${$scope.judges.length} judges.

Sincerely,
Dr. Cengiz Gunay`;

    // Send to backend
    console.log("Emailing to " + $scope.emailDest);
    $http({
      method: 'POST',
      responseType: 'text',
      headers: {},
      data: { "secret": "skjhiuwykcnbmnckuwykdkhkjdfhf",
              "from": "Judging App",
              "to": $scope.emailDest,
              "subject": "STaRS 2019 judging scores and feedback",
              "text": message,
              "attachments": [
                { "filename": "results.csv",
                  "content":
                  uiGridExporterService.formatAsCsv(
                    uiGridExporterService.getColumnHeaders(grid, uiGridExporterConstants.VISIBLE),
                    uiGridExporterService.getData(grid, uiGridExporterConstants.ALL,
                                                  uiGridExporterConstants.VISIBLE),
                    grid.options.exporterCsvColumnSeparator) } ]},
      url: '/judgemail'}).then(res => { console.log(res.data); });
    judgeColumn.showColumn();
    $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };
}).filter('fixed2', function () {
  return function (value) { return parseFloat(value).toFixed(2); }
});

/**
 * JudgeListCtrl: controller for the template that lists all of the judges
 */
app.controller('JudgeListCtrl', function ($scope, $cookies, $rootScope, pouchService, $state, $pouchdb) {
    var pouch = $pouchdb.retryReplication();
    var localPouch = $pouchdb.localDB;
    var remoteDB = $pouchdb.remoteDB;
    pouchService.getConf();

    $scope.judges = [];
    $scope.search = {};
    $scope.orderField = 'name';

    $scope.getJudges = function () {
        pouchService.getJudges()
            .then(
                function (res) {
                    $scope.judges = res;
                },
                function (err) {
                    console.log(err);
                }
            );
    };

    $scope.getJudges();
});

/**
 * JudgeCtrl: controller for the template that displays an individual judge
 */
app.controller('JudgeCtrl', function ($scope, $cookies, $rootScope, pouchService, judge, $service, $state, $pouchdb, uiGridConstants) {
    var pouch = $pouchdb.retryReplication();
    var localPouch = $pouchdb.localDB;
    var remoteDB = $pouchdb.remoteDB;
    pouchService.getConf();


    $scope.judge = judge;
    $scope.questions = [];
    $scope.surveys = [];
    $scope.empty = false;

    $service.getQuestions().then(function (res) {
        $scope.questions = res.data.questions;
    });

    $scope.getSurveysByJudge = function () {
        $scope.gridOptions.data = $scope.judge.surveys;

        if ($scope.surveys.length === 0) {
            $scope.empty = true;
        }
    };

    $scope.gridOptions = {
        enableColumnMenus: false,
        enableGridMenu: false,
        enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
        enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
        columnDefs: [
          { field: "groupId", name: "ID", width: 30,
            cellTemplate:
            '<div class="ui-grid-cell-contents">' +
            '<a ui-sref="poster({id: {{grid.getCellValue(row, col)}} })">{{grid.getCellValue(row, col)}}</a></div>',
          },
          { field: "groupName", name: "Poster Name", width: 100, "cellTooltip": true },
            { field: "answers[0]", name: "Statement of Problem", width: 100 },
            { field: "answers[1]", name: "Methodology", width: 100 },
            { field: "answers[2]", name: "Results/Solution", width: 100 },
            { field: "answers[3]", name: "Oral Presentation", width: 100 },
            { field: "answers[4]", name: "Poster Layout", width: 100 },
            { field: "answers[5]", name: "Impact", width: 100 },
            { field: "answers[6]", name: "Additional Comments", width: '*', "cellTooltip": true }
        ],
        exporterCsvFilename: 'JudgeResults.csv',
        exporterPdfDefaultStyle: { fontSize: 9 },
        exporterPdfTableStyle: { margin: [30, 30, 30, 30] },
        exporterPdfTableHeaderStyle: { fontSize: 8, bold: true, italics: true, color: '#000000' },
        exporterPdfHeader: {
            text: "GGC STaRS - Judge Report for " + $scope.judge.username,
            style: { fontSize: 14, alignment: 'center', bold: true }
        },
        exporterPdfFooter: function (currentPage, pageCount) {
            return { text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle' };
        },
        exporterPdfCustomFormatter: function (docDefinition) {
            docDefinition.styles.headerStyle = { fontSize: 22, bold: true };
            docDefinition.styles.footerStyle = { fontSize: 10, bold: true };
            return docDefinition;
        },
        exporterPdfOrientation: 'landscape',
        exporterPdfPageSize: 'LETTER',
        exporterPdfMaxGridWidth: 500,
        exporterCsvLinkElement: angular.element(document.querySelectorAll(".judge-csv-location")),
        onRegisterApi: function (gridApi) {
            $scope.gridApi = gridApi;
        }
    };

    $scope.export = function () {
        if ($scope.export_format == 'csv') {
            var myElement = angular.element(document.querySelectorAll(".judge-csv-location"));
            $scope.gridApi.exporter.csvExport('all', 'all');
        } else if ($scope.export_format == 'pdf') {
            $scope.gridApi.exporter.pdfExport('all', 'all');
        }
    };

    $scope.getSurveysByJudge();
});

/**
 * FinalReportCtrl: controller for the template that displays the final/combined report for all judges and posters
 */
app.controller('FinalReportCtrl', function ($scope, pouchService, $rootScope, $cookies, $state, $service, $pouchdb, uiGridConstants) {
    var pouch = $pouchdb.retryReplication();
    var localPouch = $pouchdb.localDB;
    var remoteDB = $pouchdb.remoteDB;
    pouchService.getConf();

    $scope.surveys = [];

    pouchService.getAllSurveys()
        .then(function (res) {

            var ReturnedRows = res.rows || [];

            _.each(ReturnedRows, function (row) {

                var DocumentDB = row.doc || {};

                var DocumentSurveys = DocumentDB.surveys || [];

                for (var j = 0; j < DocumentSurveys.length; j++) {

                    var DocumentSurvey = DocumentSurveys[j];

                    var tempSurvey = {};

                    tempSurvey.judgeName = DocumentDB.username;

                    tempSurvey.groupName = DocumentSurvey.groupName;

                    tempSurvey.groupId = DocumentSurvey.groupId;

                    tempSurvey.answers = DocumentSurvey.answers || [];

                    $scope.surveys.push(tempSurvey);

                }

            });

            $scope.gridOptions.data = $scope.surveys;

            // res.rows.forEach(function (row) {
            //     row.doc.surveys.forEach(function (survey) {
            //         var tempSurvey = {};
            //         tempSurvey.judgeName = row.doc.username;
            //         tempSurvey.groupName = survey.groupName;
            //         tempSurvey.answers = survey.answers;
            //         $scope.surveys.push(tempSurvey);
            //     });
            // });
            // $scope.gridOptions.data = $scope.surveys;
        },
            function (err) {
                console.log(err);
            }
        );

    $scope.gridOptions = {
        enableColumnMenus: false,
        enableGridMenu: false,
        enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
        enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
        columnDefs: [
            { field: "judgeName", name: "Judge Name", width: 100 },
            { field: "groupId", name: "Poster ID", width: 50 },
            { field: "groupName", name: "Poster Name", width: 150,
              cellTemplate: '<div class="ui-grid-cell-contents" title="{{grid.getCellValue(row, col)}}">{{grid.getCellValue(row, col)}}</div>'},
            { field: "answers[0]", name: "Statement of Problem", width: 50 },
            { field: "answers[1]", name: "Methodology", width: 50 },
            { field: "answers[2]", name: "Results/ Solution", width: 50 },
            { field: "answers[3]", name: "Oral Present.", width: 50 },
            { field: "answers[4]", name: "Poster Layout", width: 50 },
            { field: "answers[5]", name: "Impact", width: 50 },
            {
                field: "answers[6]",
                name: "Additional Comments",
                cellTemplate: '<div class="ui-grid-cell-contents" title="{{grid.getCellValue(row, col)}}">{{grid.getCellValue(row, col)}}</div>',
                width: '*'
            }
        ],
        exporterCsvFilename: 'FinalReport.csv',
        exporterPdfDefaultStyle: { fontSize: 9 },
        exporterPdfTableStyle: { margin: [30, 30, 30, 30] },
        exporterPdfTableHeaderStyle: { fontSize: 8, bold: true, italics: true, color: '#000000' },
        exporterPdfHeader: { text: "GGC STaRS - Final Report", style: { fontSize: 14, alignment: 'center', bold: true } },
        exporterPdfFooter: function (currentPage, pageCount) {
            return { text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle' };
        },
        exporterPdfCustomFormatter: function (docDefinition) {
            docDefinition.styles.headerStyle = { fontSize: 22, bold: true };
            docDefinition.styles.footerStyle = { fontSize: 10, bold: true };
            return docDefinition;
        },
        exporterPdfOrientation: 'landscape',
        exporterPdfPageSize: 'LETTER',
        exporterPdfMaxGridWidth: 500,
        exporterCsvLinkElement: angular.element(document.querySelectorAll(".finalReport-csv-location")),
        onRegisterApi: function (gridApi) {
            $scope.gridApi = gridApi;
        }
    };

    $scope.export = function () {

        var ExportFormat = $scope.export_format || 'csv';

        if (ExportFormat == 'csv') {
            var myElement = angular.element(document.querySelectorAll(".finalReport-csv-location"));
            $scope.gridApi.exporter.csvExport('all', 'all');
        }
        else if (ExportFormat == 'pdf') {
            $scope.gridApi.exporter.pdfExport('all', 'all');
        }
    };

});

/**
 * LogoutCtrl: controller to handle logout state
 */
app.controller('LogoutCtrl', function ($rootScope, $cookies, $state) {
    $cookies.remove('user');
    $rootScope.isAuth = false;
    $state.go('home');
});

app.filter('clearText', function () {
    return function (text) {
        var result = text ? String(text).replace(/"<[^>]+>/gm, '') : '';
        result = result.replace(/,/g, ', ');
        return result;
    };
});
