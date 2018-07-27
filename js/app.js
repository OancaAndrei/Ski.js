var App = angular.module('App', []);

App.run(function($rootScope) {
  $rootScope.onKeyDown = function(e) {
    if (e.keyCode === 116 && e.ctrlKey) return; // Enable forced refresh
    e.preventDefault();
    console.log(e.keyCode, e.shiftKey, e.ctrlKey, e);
    $rootScope.$broadcast("KeyDown", e);
  };
});
