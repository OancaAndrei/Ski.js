function Controller(player1, player2) {
  this.player1 = player1;
  this.player2 = player2;

  this.idleGesture = new Gesture();
  this.sprintGesture = new Gesture();
  this.leanGesture = new Gesture();

  this.loadGesturesFromURL();
}

Controller.prototype.onPoseUpdate = function(scope, poses) {
  for (var i = 0; i < poses.length; i++) {
    var pose = poses[i];
    var idle = scope.idleGesture.closestMatch(pose);
    var sprint = scope.sprintGesture.closestMatch(pose);
    var lean = scope.leanGesture.closestMatch(pose);
    var minDistance = 0.2;

    // console.log("Idle:", idle.distance, "Sprint:", sprint.distance, "Lean:", lean.distance);
    var player = scope.getPlayerFromPose(pose);

    if (lean.position === 1 && sprint.distance < minDistance) {
      if (sprint.position !== player.lastSprintFrame) {
        player.sprint();
        player.lastSprintFrame = sprint.position;
        // console.log("Sprint!", sprint.position);
      }
    }
    if (lean.distance < idle.distance && lean.distance < minDistance) {
      if (lean.position === 0) {
        player.leanLeft();
        // console.log("Lean left!");
      } else if (lean.position === 2) {
        player.leanRight();
        // console.log("Lean right!");
      }
    }
  }
}

Controller.prototype.getPlayerFromPose = function(pose) {
  // Get player from nose position
  if (pose.keypoints[0][0] > 0) {
    // console.log("Player 1:", pose.keypoints[0][0]);
    return this.player1;
  } else {
    // console.log("Player 2:", pose.keypoints[0][0]);
    return this.player2;
  }
}

Controller.prototype.loadGesturesFromURL = function() {
  var that = this;
  $.getJSON('gestures/idle_gesture.json', function(data) {
    that.idleGesture.import(data);
    console.log("Idle gesture:", that.idleGesture);
  });
  $.getJSON('gestures/sprint_gesture.json', function(data) {
    that.sprintGesture.import(data);
    console.log("Sprint gesture:", that.sprintGesture);
  });
  $.getJSON('gestures/lean_gesture.json', function(data) {
    that.leanGesture.import(data);
    console.log("Lean gesture:", that.leanGesture);
  });
}
