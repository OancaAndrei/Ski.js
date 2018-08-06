App.controller('Main', function($scope) {

  // Create game
  var game = new Game();
  game.init();

  $scope.$on("KeyDown", function(event, data) {
    if (data.keyCode === 38) { // Up arrow
      game.world.getPlayer(1).sprint();
    } else if (data.keyCode === 37) { // Left arrow
      game.world.getPlayer(1).leanLeft();
    } else if (data.keyCode === 39) { // Right arrow
      game.world.getPlayer(1).leanRight();
    } else if (data.keyCode === 40) { // Down arrow
      game.world.getPlayer(1).jump();
    } else if (data.keyCode === 87) { // Q
      game.world.getPlayer(0).sprint();
    } else if (data.keyCode === 65) { // A
      game.world.getPlayer(0).leanLeft();
    } else if (data.keyCode === 68) { // D
      game.world.getPlayer(0).leanRight();
    } else if (data.keyCode === 83) { // S
      game.world.getPlayer(0).jump();
    }
  });

  // Create controller
  var controller = new Controller(game.world.getPlayer(0), game.world.getPlayer(1));
  // Init Tracker
  var tracker = new Tracker(controller, controller.onPoseUpdate);
  // Init PoseNet
  loadPosenet(tracker);
});
