function Pose() {
  this.keypoints = [];
  this.scores = [];
  for (var i = 0; i < 17; i++) {
    var point = vec2.fromValues(0,0);
    this.keypoints.push(point);
    this.scores.push(1);
  }
  this.resetScores = function() {
    for (var i = 0; i < 17; i++) {
      this.scores[i] = 1;
    }
  }
  this.copy = function(pose) {
    for (var i = 0; i < 17; i++) {
      vec2.set(this.keypoints[i], pose.keypoints[i][0], pose.keypoints[i][1]);
      this.scores[i] = pose.scores[i];
    }
    return this;
  }
  this.setFromPose = function(pose, width, height) {
    var keypoints = pose.keypoints;
    for (var i = 0; i < 17; i++) {
      vec2.set(this.keypoints[i], keypoints[i].position.x - width / 2, keypoints[i].position.y - height / 2);
      this.scores[i] = keypoints[i].score;
    }
    for (var i = 0; i < 17; i++) {
      vec2.set(this.keypoints[i], this.keypoints[i][0] / width, this.keypoints[i][1] / height);
    }
    return this;
  }
  this.setScores = function(scores) {
    for (var i = 0; i < 17; i++) {
      this.scores[i] = scores[i];
    }
  }
  this.setKeypoint = function(keypoint, position, score) {
    vec2.set(this.keypoints[position], keypoint[0], keypoint[1]);
    if (score === undefined) this.scores[position] = 1;
    else this.scores[position] = score;
    console.log(keypoint);
  }
  this.computeCentroid = function(threshold) {
    threshold = threshold ? threshold : 0;
    var x = 0;
    var y = 0;
    for (var i = 0; i < 17; i++) {
      if (this.scores[i] < threshold) continue;
      x += this.keypoints[i][0];
      y += this.keypoints[i][1];
      // x += this.keypoints[i][0] * this.scores[i];
      // y += this.keypoints[i][1] * this.scores[i];
    }
    x = x / 17.0;
    y = y / 17.0;
    return vec2.fromValues(x, y);
  }
  this.computeBoundingBox = function(threshold) {
    threshold = threshold ? threshold : 0;
    var x = this.keypoints[0][0];
    var y = this.keypoints[0][1];
    var width = this.keypoints[0][0];
    var height = this.keypoints[0][1];

    for (var i = 0; i < 17; i++) {
      if (this.scores[i] < threshold) continue;
      x = this.keypoints[i][0] < x ? this.keypoints[i][0] : x;
      y = this.keypoints[i][1] < y ? this.keypoints[i][1] : y;
      width = this.keypoints[i][0] > width ? this.keypoints[i][0] : width;
      height = this.keypoints[i][1] > height ? this.keypoints[i][1] : height;
    }
    return vec4.fromValues(x, y, Math.abs(width - x), Math.abs(height - y));
  }
  this.keypointsToPoint = function(point) {
    for (var i = 0; i < 17; i++) {
      vec2.set(this.keypoints[i], this.keypoints[i][0] - point[0], this.keypoints[i][1] - point[1]);
    }
  }
  this.scaleKeypoints = function(scaleX, scaleY) {
    for (var i = 0; i < 17; i++) {
      vec2.set(this.keypoints[i], this.keypoints[i][0] * scaleX, this.keypoints[i][1] * scaleY);
    }
  }
  this.distance = function(pose, weights) {
    // Local copy of data
    var thisPose = new Pose().copy(this);
    var thatPose = new Pose().copy(pose);
    thisPose.setScores(weights);
    thatPose.setScores(weights);

    // Compute bounding box and shift points to top left corner of the box
    var thisBoundingBox = thisPose.computeBoundingBox(0.5);
    var thatBoundingBox = thatPose.computeBoundingBox(0.5);

    thisPose.keypointsToPoint(thisBoundingBox);
    thatPose.keypointsToPoint(thatBoundingBox);

    // Calculate scaling to match width
    var scaleX = thatBoundingBox[2] / thisBoundingBox[2];
    var scaleY = thatBoundingBox[3] / thisBoundingBox[3];

    // Scale thisPose
    thisPose.scaleKeypoints(scaleX, scaleY);

    // Calculate distance
    var distance = 0;
    for (var i = 0; i < 17; i++) {
      distance += vec2.distance(thisPose.keypoints[i], thatPose.keypoints[i]) * weights[i];
    }
    return distance;
  }
  this.export = function() {
    return [this.keypoints, this.scores];
  }
  this.import = function(array) {
    for (var i = 0; i < 17; i++) {
      vec2.set(this.keypoints[i], array[0][i][0], array[0][i][1]);
      this.scores[i] = array[1][i];
    }
    return this;
  }
}
