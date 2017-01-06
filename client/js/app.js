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
  $stateProvider.state('posterList', {
    url: '/posterList',
    controller: 'PosterListCtrl',
    templateUrl: 'templates/posterList.html'
  });
  $stateProvider.state('judgesList', {
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
  $urlRouterProvider.otherwise('/');
});

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

app.factory('$service', function($http, $q, md5, $rootScope, pouchService) {
  var pouch = pouchService.retryReplication();
  var localPouch = pouchService.localDB;
  var remoteDB = pouchService.remoteDB;
  var authorized = {};
  return {
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
    }
  };
});


app.controller('NavbarCtrl', function() {
  $rootScope.isAuth = false;
});

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

app.controller('PosterCtrl', function($scope, poster, $cookies, $rootScope) {
  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

  console.log(poster);
});

app.controller('JudgeListCtrl', function($scope, $cookies, $rootScope) {
  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

});

app.controller('JudgeCtrl', function($scope, $cookies, $rootScope) {
  if($cookies.get('user') === undefined) {
    $rootScope.isAuth = false;
    $state.go('home');
  } else {
    $rootScope.isAuth = true;
  }

});
