var app = angular.module('app', ['ngAnimate', 'toastr', 'ui.router', 'ngCookies', 'angular-md5', 'pouchdb']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider.state('home', {
    url: '/',
    controller: 'HomeCtrl',
    templateUrl: 'templates/home.html'
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

app.factory('$service', function($http, $pouchDB, $q, md5, $rootScope, pouchService) {
  var pouch = pouchService.retryReplication();
  var localPouch = pouchService.localDB;
  var remoteDB = pouchService.remoteDB;
  var authorized = {};
  return {
    login: function(username, password) {
      var deferred = $q.defer();
      var hasHash = false;
      var id;
      return localPouch.allDocs({
        include_docs: true,
        attachments: true
      }).then(function(res) {
        console.log(res);
        res.rows.forEach(function(row) {
          if(angular.equals(row.doc.username,username) && angular.equals(row.doc.password,password)) {
            id = row.doc._id;
            if(row.doc.hash !== '') {
              deferred.resolve(row.doc.hash);
              hasHash = true;
            } else {

              var hash = md5.createHash(row.doc.username || '');
              deferred.resolve(hash);
              var doc = row.doc;
              localPouch.put({
                _id: doc._id,
                _rev: doc._rev,
                hash: hash,
                username: doc.username,
                password: doc.password,
                surveys: doc.surveys
              }).catch(function(err) {
                console.log(err);
              });
            }
          }
        });
        return {
          promise: deferred.promise,
          value: hasHash,
          id: id
        };
      }).catch(function(err) {
        console.log(err);
      });
    },
    getAuthorized: function() {
      console.log(authorized);
      return authorized;
    },
    setAuthorized: function(id, hash) {
      authorized = {id, hash};
      console.log(authorized);
    },
    logout: function() {
      var deferred = $q.defer();
      authorized = {};
      deferred.resolve(authorized);
      return deferred.promise;
    }
  };
});


app.controller('NavbarCtrl', function() {

});

app.controller('HomeCtrl', function($scope, $cookies, pouchService) {
  $scope.pouchService = pouchService.retryReplication();
  var localPouch = pouchService.localDB;
  var remoteDB = pouchService.remoteDB;

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
    $scope.user.username = name;
  };


  $scope.submitForm = function() {
    $service.login($scope.user.username, $scope.user.password).then(function(res) {
      console.log(res);
      var id;
      if(res.id === undefined) {
        $rootScope.isAuth = false;
        $ionicPopup.alert({
          title: 'Error',
          template: '<p style=\'text-align:center\'>Invalid username or password</p>'
        });
        return;
      } else if(res.value === false) {
        id = res.id;
        $rootScope.isAuth = true;
        // set the user's auto generated id as the key within localstorage to maintain the login state
        window.localStorage.setItem(res.id, JSON.stringify(res.promise.$$state.value));
        $service.setAuthorized(res.id, res.promise.$$state.value);
        $cookies.put(res.id, res.promise.$$state.value);
      } else if(res.value === true) {
        id = res.id;
        $rootScope.isAuth = true;
        $service.setAuthorized(res.id, res.promise.$$state.value);
        $cookies.put(res.id, res.promise.$$state.value);
      }
      $timeout(function() {
        $state.go('tabs.home');
        $scope.user.username = '';
        $scope.user.password = '';
        $scope.search.value = '';
      }, 0);
    });
  };
});

app.controller('DashboardCtrl', function($scope, pouchService, $servie) {
  $scope.pouchService = pouchService.retryReplication();
  var localPouch = pouchService.localDB;
  var remoteDB = pouchService.remoteDB;

});
