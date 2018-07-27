App.controller('Main', function($scope) {

  var game = new Game();
  game.init();

  $scope.$on("KeyDown", function(event, data) {
    if (data.keyCode === 38) { // Up arrow
      game.applyForce(1, 0, 0);
    } else if (data.keyCode === 37) { // Left arrow
      game.applyForce(0, 1, 0);
    } else if (data.keyCode === 40) { // Down arrow
      game.applyForce(-1, 0, 0);
    } else if (data.keyCode === 39) { // Right arrow
      game.applyForce(0, -1, 0);
    }
  });
});
