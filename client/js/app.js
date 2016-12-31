var app = angular.module('app', ['ngAnimate', 'toastr', 'ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider.state('home', {
    url: '/',
    controller: 'HomeCtrl',
    templateUrl: 'templates/home.html'
  });
  $urlRouterProvider.otherwise('/');
});

app.controller('NavbarCtrl', function() {

});

app.controller('HomeCtrl', function($scope) {

});
