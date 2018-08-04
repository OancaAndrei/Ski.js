App.controller('Main', function($scope) {

  // Create game
  var game = new Game();
  game.init();

  $scope.$on("KeyDown", function(event, data) {
    if (data.keyCode === 38) { // Up arrow
      game.player2.sprint();
    } else if (data.keyCode === 37) { // Left arrow
      game.player2.leanLeft();
    } else if (data.keyCode === 39) { // Right arrow
      game.player2.leanRight();
    } else if (data.keyCode === 32) { // Space
      game.player2.jump();
    } else if (data.keyCode === 87) { // Q
      game.player1.sprint();
    } else if (data.keyCode === 65) { // A
      game.player1.leanLeft();
    } else if (data.keyCode === 68) { // D
      game.player1.leanRight();
    } else if (data.keyCode === 83) { // S
      game.player1.jump();
    }
  });

  // Create controller
  var controller = new Controller(game.player1, game.player2);
  // Init Tracker
  var tracker = new Tracker(controller, controller.onPoseUpdate);
  // Init PoseNet
  loadPosenet(tracker);
});
