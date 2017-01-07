var app = angular.module('app', ['ngAnimate', 'toastr', 'ui.router', 'ngCookies', 'angular-md5', 'pouchdb', 'toastr']);

app.config(function($stateProvider, $urlRouterProvider) {
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
        '$stateParams', '$service',
        function($stateParams, $service) {
          return $service.getJudge($stateParams.id);
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

/* ==========================================================================
   Services
   ========================================================================== */
/**
 * pouchService: establishes and maintains connection with Couchdb
 */
app.service('pouchService', function($rootScope, pouchDB, $log, pouchDBDecorators) {
  this.retryReplication = function() {
    var self = this;
    var replicate;
    var status;
    var opts = {
      live: true,
      retry: true,
      continuous: true
    };
    self.localDB = pouchDB('judges');
    self.remoteDB = pouchDB('http://127.0.0.1:5984/judges');
    self.localDB.sync('http://127.0.0.1:5984/judges', opts)
    .on('change', function(change) {
      console.log('yo something changed');
      console.log(change);
    }).on('paused', function(info) {
      console.log('PAUSED');
    }).on('active', function(info) {
      console.log(info);
      console.log('ACTIVE');
    }).on('error', function(err) {
      console.log(err);
      console.log('ERROR');
    });
  };
});

/**
 * $service: functions to maintain user state and to extract and update the data from Couchdb
 */
app.factory('$service', function($http, $q, md5, $rootScope, pouchService) {
  var pouch = pouchService.retryReplication();
  var localPouch = pouchService.localDB;
  var remoteDB = pouchService.remoteDB;
  var authorized = {};
  return {
    getQuestions: function() {
      return $http.get('./survey.json');
    },
    getJudge: function(id) {
      var deferred = $q.defer();
      localPouch.get(id).then(function(res) {
        deferred.resolve(res);
      }).catch(function(err) {
        deferred.reject(res);
      });
      return deferred.promise;
    },
    getPoster: function() {
      return $http.get('./posters.json');
    },
    login: function(username, password) {
      var deferred = $q.defer();
      var id;
      localPouch.allDocs({
        include_docs: true,
        attachments: true
      }).then(function(res) {
        res.rows.forEach(function(row) {
          if(angular.equals(row.doc.username,username) && angular.equals(row.doc.password,password)) {
            var doc = row.doc;
            id = doc._id;
            localPouch.put({
              _id: doc._id,
              _rev: doc._rev,
              username: doc.username,
              password: doc.password,
              surveys: doc.surveys
            }).catch(function(err) {
              console.log(err);
            });
          }
        });
      }).then(function() {
        localPouch.get(id).then(function(res) {
          deferred.resolve(res);
        }).catch(function(err) {
          deferred.reject(err);
          console.log(err);
        });
      }).catch(function(err) {
        console.log(err);
      });
      return deferred.promise;
    },
    getAuthorized: function() {
      return authorized;
    },
    setAuthorized: function(id, hash) {
      authorized = {id, hash};
    },
    logout: function() {
      var deferred = $q.defer();
      authorized = {};
      deferred.resolve(authorized);
      return deferred.promise;
    },
    getSurveysByJudges: function(id) {
      var deferred = $q.defer();
      var resultSurvey = [];
      localPouch.get(id).then(function(doc) {
        doc.surveys.forEach(function(survey) {
          if(doc.survey.groupId !== '') {
            resultSurvey.push(survey);
          }
        });
        deferred.resolve(resultSurvey);
      }).catch(function(err) {
        deferred.reject(err);
        console.log(err);
      });
      return deferred.promise;
    },
    getSurveysForGroup: function(id) {
      var deferred = $q.defer();
      var result = [];
      var resultObj = {};
      localPouch.allDocs({
        include_docs: true,
        attachments: true
      }).then(function(res) {
        res.rows.forEach(function(row) {
          console.log(row.doc.surveys.length);
          for(var i = 0; i < row.doc.surveys.length; i++) {
            if(row.doc.surveys[i].groupId == id) {
              resultObj.judgeName = row.doc.username;
              resultObj.answers = row.doc.surveys[i].answers;
              result.push(resultObj);
            }
          }
        });
        deferred.resolve(result);
      }).catch(function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
  };
});

/* ==========================================================================
   Controllers
   ========================================================================== */
/**
 * NavbarCtrl: controller for the navbar (header)
 */
app.controller('NavbarCtrl', function() {
  $rootScope.isAuth = false;
});

/**
 * HomeCtrl: controller for the login page (initial page)
 */
app.controller('HomeCtrl', function($scope, $cookies, pouchService, $service, $rootScope, $timeout, $state, toastr) {
  $scope.pouchService = pouchService.retryReplication();
  var localPouch = pouchService.localDB;
  var remoteDB = pouchService.remoteDB;
  $rootScope.isAuth = false;

  $scope.items = [];
  $scope.user = {};
  $scope.search = {};

  $scope.getItems = function() {
    localPouch.allDocs({
      include_docs: true,
      attachments: true
    }).then(function(result) {
      var docs = result.rows;
      docs.forEach(function(res) {
        var item = {name: res.doc.username};
        $scope.items.push(item);
      });
    }).catch(function(err) {
      console.log(err);
    });
  };

  $scope.getItems();


  $scope.updateSelection = function(name) {
    $('#active').focus();
    $scope.user.username = name;
  };


  $scope.submitForm = function(user) {
    $service.login(user.username, user.password)
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
      });
  };
});

/**
 * DashboardCtrl: controller for the main page
 */
app.controller('DashboardCtrl', function($scope, pouchService, $service, $cookies, $rootScope) {
  $scope.pouchService = pouchService.retryReplication();
  var localPouch = pouchService.localDB;
  var remoteDB = pouchService.remoteDB;
  $scope.items = [];
  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.getSurveys = function(id) {
    $service.getSurveysByJudges(id).then(function(res) {
      console.log(res);
    });
  };

  $scope.getJudges = function() {
    localPouch.allDocs({
      include_docs: true,
      attachments: true
    }).then(function(res) {
      res.rows.forEach(function(row) {
        var doc = {};
        doc.id = row.id;
        doc.username = row.doc.username;
        doc.surveys = row.doc.surveys;
        $scope.items.push(doc);
      });
    }).catch(function(err) {
      console.log(err);
    });
  };

  $scope.getJudges();
});

/**
 * PosterListCtrl: controller for the template that lists all of the posters
 */
app.controller('PosterListCtrl', function($scope, $service, $cookies, $rootScope) {
  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.posters = [];
  $service.getPoster().then(function(res) {
    $scope.posters = res.data.posters;
  });
});

/**
 * PosterCtrl: controller fot the template that displays an individual poster
 */
app.controller('PosterCtrl', function($scope, poster, $cookies, $rootScope, $service, toastr) {
  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.poster = poster;
  $scope.judges = [];
  $scope.questions = [];
  $scope.empty = false;
  var judge = {};

  $service.getQuestions().then(function(res) {
    $scope.questions = res.data.questions;
  });

  $service.getSurveysForGroup($scope.poster.id).then(
    function(res) {
      res.forEach(function(doc) {
        judge.name = doc.judgeName;
        judge.answers = doc.answers;
        $scope.judges.push(judge);
      });
      if($scope.judges.length == 0) {
        $scope.empty = true;
      }
    },
    function(err) {
      toastr.error('There was an error retrieving the poster information');
      console.log(err);
    }
  );

});

/**
 * JudgeListCtrl: controller for the template that lists all of the judges
 */
app.controller('JudgeListCtrl', function($scope, $cookies, $rootScope, pouchService) {
  $scope.pouchService = pouchService.retryReplication();
  var localPouch = pouchService.localDB;
  var remoteDB = pouchService.remoteDB;
  $scope.judges = [];

  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $scope.getJudges = function() {
    localPouch.allDocs({
      include_docs: true,
      attachments: true
    }).then(function(res) {
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
        $scope.judges.push(doc);
      });
    }).catch(function(err) {
      console.log(err);
    });
  };

  $scope.getJudges();
});

/**
 * JudgeCtrl: controller fot the template that displays an individual judge
 */
app.controller('JudgeCtrl', function($scope, $cookies, $rootScope, pouchService, judge, $service) {
  $scope.pouchService = pouchService.retryReplication();
  var localPouch = pouchService.localDB;
  var remoteDB = pouchService.remoteDB;
  $scope.judge = judge;
  $scope.questions = [];
  $scope.surveys = [];
  $scope.empty = false;

  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  $service.getQuestions().then(function(res) {
    $scope.questions = res.data.questions;
  });

  $scope.getSurveysByJudge = function() {
    $scope.judge.surveys.forEach(function(survey) {
      $scope.surveys.push(survey);
    });
    if($scope.surveys.length == 0) {
      $scope.empty = true;
    }
  };

  $scope.getSurveysByJudge();
});

app.controller('LogoutCtrl', function($rootScope, $cookies, $state) {
  $cookies.remove('user');
  $rootScope.isAuth = false;
  $state.go('home');
});
