var app = angular.module('app', ['ngAnimate', 'toastr', 'ui.router', 'ui.grid', 'ngTouch', 'ui.grid.autoResize', 'ui.grid.exporter', 'ngCookies', 'angular-md5', 'pouchdb', 'toastr']);

/* ==========================================================================
   Config
   ========================================================================== */
/**
 * config: handles application routing and data feed through specific url's
 */
app.config(function($stateProvider, $urlRouterProvider, toastrConfig) {
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
      '$stateParams', '$http', '$q',
        function($stateParams, $http, $q) {
          return $http.get('./posters.json').then(function(res) {
            var deferred = $q.defer();
            res.data.posters.forEach(function(poster) {
              if(poster.id == $stateParams.id) {
                console.log(poster);
                deferred.resolve(poster);
              }
            });
            return deferred.promise;
          });
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
        function($stateParams, pouchService) {
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

app.run(function(pouchService) {
  pouchService.setDatabase('judges');
  pouchService.sync('http://127.0.0.1:5984/judges');
});

/* ==========================================================================
   Services
   ========================================================================== */
/**
 * pouchService: establishes and maintains connection with Couchdb and Pouchdb
 */
app.service('pouchService', function($rootScope, pouchDB, $q) {
  var database;
  var changeListener;

  this.getUsers = function() {
    var deferred = $q.defer();
    database.allDocs({
      include_docs: true,
      attachments: true
    }).then(function(res) {
      deferred.resolve(res.rows);
    }).catch(function(err) {
      console.log(err);
      deferred.reject(err);
    });
    return deferred.promise;
  };

  this.setDatabase = function(dbName) {
    database = new PouchDB(dbName);
    database.setMaxListeners(30);
  };

  this.startListening = function() {
    changeListener = database.changes({
      since: 'now',
      live: true,
      include_docs: true
    }).on("change", function(change) {
      if(!change.deleted) {
        $rootScope.$broadcast("pouchService: change", change);
      } else {
        $rootScope.$broadcast("$pouchDB:delete", change);
      }
    });
  };

  this.stopListening = function() {
    changeListener.cancel();
  };

  this.sync = function(remoteDatabase) {
    database.sync(remoteDatabase, {
      live: true,
      retry: true
    }).on('change', function (change) {
      console.log('change');
      console.log(change);
    }).on('paused', function (info) {
      // replication was paused, usually because of a lost connection
      console.log('paused');
    }).on('active', function (info) {
      console.log('active');
      console.log(info);
    }).on('error', function (err) {
      console.log('error');
      console.log(err);
    });
  };

  this.login = function(username, password) {
    var deferred = $q.defer();
    database.allDocs({
      include_docs: true,
      attachments: true
    }).then(function(res) {
      res.rows.forEach(function(row) {
        if(angular.equals(row.doc.username,username) && angular.equals(row.doc.password,password)) {
          deferred.resolve(row.doc);
        }
      });
    }).catch(function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  this.getJudge = function(id) {
    console.log('getJudge');
    var deferred = $q.defer();
    database.get(id).then(function(doc) {
      console.log(doc);
      deferred.resolve(doc);
    }).catch(function(err) {
      deferred.reject(err);
      console.log(err);
    });
    return deferred.promise;
  };

  this.getGroupSurveys = function(groupId) {
    var deferred = $q.defer();
    var result = [];
    database.allDocs({
      include_docs: true,
      attachments: true
    }).then(function(res) {
      res.rows.forEach(function(row) {
        row.doc.surveys.forEach(function(survey) {
          if(survey.groupId === groupId) {
            var resultObj = {};
            resultObj.judgeName = row.doc.username;
            resultObj.answers = survey.answers;
            result.push(resultObj);
          }
        });
      });
      deferred.resolve(result);
    }).catch(function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  this.countCompletedSurveys = function(id) {
    var deferred = $q.defer();
    var result = [];
    database.allDocs({
      include_docs: true,
      attachments: true
    }).then(function(res) {
      res.rows.forEach(function(row) {
        for(var i = 0; i < row.doc.surveys.length; i++) {
          if(row.doc.surveys[i].groupId == id) {
            result.push(row.doc.username);
          }
        }
      });
      deferred.resolve(result);
    }).catch(function(err) {
      deferred.reject(err);
      console.log(err);
    });
    return deferred.promise;
  };

  this.getAllSurveys = function() {
    var deferred = $q.defer();
    database.allDocs({
      include_docs: true,
      attachments: true
    }).then(function(res) {
      deferred.resolve(res);
    }).catch(function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  this.getJudges = function() {
    var deferred = $q.defer();
    database.allDocs({
      include_docs: true,
      attachments: true
    }).then(function(res) {
      var judges = [];
      res.rows.forEach(function(row) {
        var doc = {
          id: '',
          name: '',
          surveys: [],
          surveyLength: 0,
          groupsSurveyed: []
        };
        doc.id = row.id;
        doc.name = row.doc.username;
        doc.surveys = row.doc.surveys;
        doc.surveyLength = row.doc.surveys.length;
        row.doc.surveys.forEach(function(survey) {
          console.log(survey);
          doc.groupsSurveyed.push(survey.groupName);
        });
        judges.push(doc);
      });
      deferred.resolve(judges);
    }).catch(function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
});

/**
 * $service: functions to maintain user state and to extract and update the data from Couchdb
 */
app.factory('$service', function($http, $q, md5, $rootScope, pouchService) {
  return {
    getQuestions: function() {
      return $http.get('./survey.json');
    },
    getPoster: function() {
      return $http.get('./posters.json');
    }
  };
});

/* ==========================================================================
   Controllers
   ========================================================================== */
/**
 * NavbarCtrl: controller for the navbar (header)
 */
app.controller('NavbarCtrl', function($rootScope, $scope, toastr) {
  $rootScope.isAuth = false;

  $scope.checkAuth = function() {
    if($rootScope.isAuth === false) {
      toastr.warning('You must sign in to access the application');
    }
  };

});

/**
 * HomeCtrl: controller for the login page (initial page)
 */
app.controller('HomeCtrl', function($scope, $cookies, pouchService, $service, $rootScope, $timeout, $state, toastr) {
  pouchService.startListening();

  $rootScope.isAuth = false;

  $scope.items = [];
  $scope.user = {};
  $scope.search = {};

  $scope.getItems = function() {
    pouchService.getUsers()
    .then(
      function(res) {
        res.forEach(function(row) {
          var item = {name: row.doc.username};
          $scope.items.push(item);
        });
      },
      function(err) {
        console.log(err);
      }
    );
  };

  $scope.getItems();


  $scope.updateSelection = function(name) {
    $('#active').focus();
    $scope.user.username = name;
  };


  $scope.submitForm = function(user) {
    pouchService.login(user.username, user.password)
    .then(
      function(res) {
        $cookies.put('user', res._id);
        $rootScope.isAuth = true;
        $state.go('dashboard');
        toastr.success('You are now logged in!');
      },
      function(err) {
        toastr.error('Invalid login credientials');
        return;
      }
    );
  };
});

/**
 * DashboardCtrl: controller for the main page
 */
app.controller('DashboardCtrl', function($scope, pouchService, $service, $cookies, $rootScope, $state) {
  pouchService.startListening();

  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.items = [];

  $scope.getJudges = function() {
    pouchService.getUsers().then(function(res) {
      res.forEach(function(doc) {
        var document = {};
        document.id = doc.id;
        document.username = doc.username;
        document.surveys = doc.surveys;
        $scope.items.push(document);
      });
    }).catch(function(err) {
      console.log(err);
    });
  };

  $scope.getJudges();

  $scope.$on('$destroy', function() {
    pouchService.stopListening();
  });
});

/**
 * PosterListCtrl: controller for the template that lists all of the posters
 */
app.controller('PosterListCtrl', function($scope, $service, $cookies, $rootScope, $state, pouchService) {
  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.posters = [];
  $scope.search = {};

  $service.getPoster().then(function(res) {
    $scope.posters = res.data.posters;
    $scope.posters.forEach(function(poster) {
      pouchService.countCompletedSurveys(poster.id).then(function(res) {
        poster.countJudges = res.length;
        poster.judges = res;
      });
    });
  });
});

/**
 * PosterCtrl: controller for the template that displays an individual poster
 */
app.controller('PosterCtrl', function($scope, poster, $cookies, $rootScope, $service, toastr, $timeout, $state, pouchService) {
  pouchService.startListening();

  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.poster = poster;
  $scope.judges = [];
  $scope.questions = [];
  $scope.loading = true;

  $service.getQuestions().then(function(res) {
    $scope.questions = res.data.questions;
  });

  $scope.gridOptions = {
    enableColumnMenus: false,
    enableGridMenu: false,
    columnDefs: [
      { field: "name" , name: "Judge Name"},
      { field: "answers[0]", name: "Information and Background" },
      { field: "answers[1]", name: "Question, Problem, and Hypothesis" },
      { field: "answers[2]", name: "Experimental Approach and Design" },
      { field: "answers[3]", name: "Data and Results" },
      { field: "answers[4]", name: "Discussion and Conclusion" },
      { field: "answers[5]", name: "Research Originality, Novelty" },
      { field: "answers[6]", name: "Poster Organization, Style, Visual Appeal" },
      { field: "answers[7]", name: "Oral Presentation of Research" },
      { field: "answers[8]", name: "Ability to Answer Questions" },
      { field: "answers[9]", name: "Overall Presentation" },
      { field: "answers[10]", name: "Additional Comments", cellTemplate:'<div class="ui-grid-cell-contents">...</div>' }
    ],
    exporterCsvFilename: 'PosterResults.csv',
    exporterPdfDefaultStyle: {fontSize: 9},
    exporterPdfTableStyle: {margin: [30, 30, 30, 30]},
    exporterPdfTableHeaderStyle: {fontSize: 8, bold: true, italics: true, color: '#000000'},
    exporterPdfHeader: { text: "GGC STaRS - Poster Report for " + $scope.poster.group + " / Students: " + $scope.poster.students, style: {fontSize: 14, alignment: 'center', bold: true} },
    exporterPdfFooter: function ( currentPage, pageCount ) {
      return { text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle' };
    },
    exporterPdfCustomFormatter: function ( docDefinition ) {
      docDefinition.styles.headerStyle = { fontSize: 22, bold: true };
      docDefinition.styles.footerStyle = { fontSize: 10, bold: true };
      return docDefinition;
    },
    exporterPdfOrientation: 'landscape',
    exporterPdfPageSize: 'LETTER',
    exporterPdfMaxGridWidth: 500,
    exporterCsvLinkElement: angular.element(document.querySelectorAll(".poster-csv-location")),
    onRegisterApi: function(gridApi){
      $scope.gridApi = gridApi;
    }
  };

  pouchService.getGroupSurveys($scope.poster.id)
  .then(
    function(res) {
      res.forEach(function(doc) {
        var judge = {};
        judge.name = doc.judgeName;
        judge.answers = doc.answers;
        $scope.judges.push(judge);
      });
      $scope.gridOptions.data = $scope.judges;
    },
    function(err) {
      toastr.error('There was an error retrieving the poster information');
      console.log(err);
    }
  );

  $scope.export = function(){
    if ($scope.export_format == 'csv') {
      var myElement = angular.element(document.querySelectorAll(".poster-csv-location"));
      $scope.gridApi.exporter.csvExport( 'all', 'all' );
    } else if ($scope.export_format == 'pdf') {
      $scope.gridApi.exporter.pdfExport( 'all', 'all' );
    }
  };
});

/**
 * JudgeListCtrl: controller for the template that lists all of the judges
 */
app.controller('JudgeListCtrl', function($scope, $cookies, $rootScope, pouchService, $state) {
  pouchService.startListening();

  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.judges = [];
  $scope.search = {};

  $scope.getJudges = function() {
    pouchService.getJudges()
    .then(
      function(res) {
        console.log(res);
        $scope.judges = res;
      },
      function(err) {
        console.log(err);
      }
    );
  };

  $scope.getJudges();
});

/**
 * JudgeCtrl: controller for the template that displays an individual judge
 */
app.controller('JudgeCtrl', function($scope, $cookies, $rootScope, pouchService, judge, $service, $state) {
  pouchService.startListening();

  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.judge = judge;
  $scope.questions = [];
  $scope.surveys = [];
  $scope.empty = false;

  $service.getQuestions().then(function(res) {
    $scope.questions = res.data.questions;
  });

  $scope.getSurveysByJudge = function() {
    $scope.gridOptions.data = $scope.judge.surveys;

    if($scope.surveys.length === 0) {
      $scope.empty = true;
    }
  };

  $scope.gridOptions = {
    enableColumnMenus: false,
    enableGridMenu: false,
    columnDefs: [
      { field: "groupName" , name: "Poster Name"},
      { field: "answers[0]", name: "Information and Background" },
      { field: "answers[1]", name: "Question, Problem, and Hypothesis" },
      { field: "answers[2]", name: "Experimental Approach and Design" },
      { field: "answers[3]", name: "Data and Results" },
      { field: "answers[4]", name: "Discussion and Conclusion" },
      { field: "answers[5]", name: "Research Originality, Novelty" },
      { field: "answers[6]", name: "Poster Organization, Style, Visual Appeal" },
      { field: "answers[7]", name: "Oral Presentation of Research" },
      { field: "answers[8]", name: "Ability to Answer Questions" },
      { field: "answers[9]", name: "Overall Presentation" },
      { field: "answers[10]", name: "Additional Comments", cellTemplate:'<div class="ui-grid-cell-contents">...</div>' }
    ],
    exporterCsvFilename: 'JudgeResults.csv',
    exporterPdfDefaultStyle: {fontSize: 9},
    exporterPdfTableStyle: {margin: [30, 30, 30, 30]},
    exporterPdfTableHeaderStyle: {fontSize: 8, bold: true, italics: true, color: '#000000'},
    exporterPdfHeader: { text: "GGC STaRS - Judge Report for " + $scope.judge.username, style: {fontSize: 14, alignment: 'center', bold: true} },
    exporterPdfFooter: function ( currentPage, pageCount ) {
      return { text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle' };
    },
    exporterPdfCustomFormatter: function ( docDefinition ) {
      docDefinition.styles.headerStyle = { fontSize: 22, bold: true };
      docDefinition.styles.footerStyle = { fontSize: 10, bold: true };
      return docDefinition;
    },
    exporterPdfOrientation: 'landscape',
    exporterPdfPageSize: 'LETTER',
    exporterPdfMaxGridWidth: 500,
    exporterCsvLinkElement: angular.element(document.querySelectorAll(".judge-csv-location")),
    onRegisterApi: function(gridApi){
      $scope.gridApi = gridApi;
    }
  };

  $scope.export = function(){
    if ($scope.export_format == 'csv') {
      var myElement = angular.element(document.querySelectorAll(".judge-csv-location"));
      $scope.gridApi.exporter.csvExport( 'all', 'all' );
    } else if ($scope.export_format == 'pdf') {
      $scope.gridApi.exporter.pdfExport( 'all', 'all' );
    }
  };

  $scope.getSurveysByJudge();
});

/**
 * FinalReportCtrl: controller for the template that displays the final/combined report for all judges and posters
 */
app.controller('FinalReportCtrl', function($scope, pouchService, $rootScope, $cookies, $state, $service) {
  pouchService.startListening();

  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.surveys = [];

  pouchService.getAllSurveys()
  .then(
    function(res) {
      res.rows.forEach(function(row) {
        row.doc.surveys.forEach(function(survey) {
          var tempSurvey = {};
          tempSurvey.judgeName = row.doc.username;
          tempSurvey.groupName = survey.groupName;
          tempSurvey.answers = survey.answers;
          $scope.surveys.push(tempSurvey);
        });
      });
      $scope.gridOptions.data = $scope.surveys;
    },
    function(err) {
      console.log(err);
    }
  );

  $scope.gridOptions = {
    enableColumnMenus: false,
    enableGridMenu: false,
    columnDefs: [
      { field: "judgeName" , name: "Judge Name"},
      { field: "groupName", name: "Poster Name" },
      { field: "answers[0]", name: "Information and Background" },
      { field: "answers[1]", name: "Question, Problem, and Hypothesis" },
      { field: "answers[2]", name: "Experimental Approach and Design" },
      { field: "answers[3]", name: "Data and Results" },
      { field: "answers[4]", name: "Discussion and Conclusion" },
      { field: "answers[5]", name: "Research Originality, Novelty" },
      { field: "answers[6]", name: "Poster Organization, Style, Visual Appeal" },
      { field: "answers[7]", name: "Oral Presentation of Research" },
      { field: "answers[8]", name: "Ability to Answer Questions" },
      { field: "answers[9]", name: "Overall Presentation" },
      { field: "answers[10]", name: "Additional Comments", cellTemplate:'<div class="ui-grid-cell-contents">...</div>' }
    ],
    exporterCsvFilename: 'FinalReport.csv',
    exporterPdfDefaultStyle: {fontSize: 9},
    exporterPdfTableStyle: {margin: [30, 30, 30, 30]},
    exporterPdfTableHeaderStyle: {fontSize: 8, bold: true, italics: true, color: '#000000'},
    exporterPdfHeader: { text: "GGC STaRS - Final Report", style: {fontSize: 14, alignment: 'center', bold: true} },
    exporterPdfFooter: function ( currentPage, pageCount ) {
      return { text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle' };
    },
    exporterPdfCustomFormatter: function ( docDefinition ) {
      docDefinition.styles.headerStyle = { fontSize: 22, bold: true };
      docDefinition.styles.footerStyle = { fontSize: 10, bold: true };
      return docDefinition;
    },
    exporterPdfOrientation: 'landscape',
    exporterPdfPageSize: 'LETTER',
    exporterPdfMaxGridWidth: 500,
    exporterCsvLinkElement: angular.element(document.querySelectorAll(".finalReport-csv-location")),
    onRegisterApi: function(gridApi){
      $scope.gridApi = gridApi;
    }
  };

  $scope.export = function(){
    if ($scope.export_format == 'csv') {
      var myElement = angular.element(document.querySelectorAll(".finalReport-csv-location"));
      $scope.gridApi.exporter.csvExport( 'all', 'all' );
    } else if ($scope.export_format == 'pdf') {
      $scope.gridApi.exporter.pdfExport( 'all', 'all' );
    }
  };

});

/**
 * LogoutCtrl: controller to handle logout state
 */
app.controller('LogoutCtrl', function($rootScope, $cookies, $state) {
  $cookies.remove('user');
  $rootScope.isAuth = false;
  $state.go('home');
});

app.filter('clearText', function() {
  return function(text) {
    var result = text ? String(text).replace(/"<[^>]+>/gm , '') : '';
    result = result.replace(/,/g, ', ');
    return result;
  };
});
