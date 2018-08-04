var App = angular.module('App', []);

App.run(function($rootScope) {
  $rootScope.onKeyDown = function(e) {
    $rootScope.$broadcast("KeyDown", e);
  };
});
