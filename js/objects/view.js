function View(player) {
  this.left = 0;
  this.top = 0;
  this.width = 1;
  this.height = 1;
  this.up = [0, 0, 1];
  this.fov = 45;
  this.background = new THREE.Color(1, 1, 1);
  this.mode = 'follow';
  this.player = player;

  this.camera = new THREE.PerspectiveCamera(this.fov, window.innerWidth / window.innerHeight, 0.1, 10000);
  this.camera.up.fromArray(this.up);
}

View.prototype.configure = function(left, top, width, height, up, fov, background) {
  this.left = left !== undefined ? left : 0;
  this.top = top !== undefined ? top : 0;
  this.width = width !== undefined ? width : 1;
  this.height = height !== undefined ? height : 1;
  this.up = up !== undefined ? up : [0, 0, 1];
  this.fov = fov !== undefined ? fov : 45;
  this.background = background !== undefined ? background : new THREE.Color(1, 1, 1);
}

View.prototype.followPlayer = function() {
  var position = this.player.getPosition();
  position = new THREE.Vector3().copy(position);
  this.camera.position.x = position.x - 0.5;
  this.camera.position.y = position.y - 0.5;
  this.camera.position.z = position.z + 0.3;
  position.z += 0.2;
  this.camera.lookAt(position);
}

View.prototype.rearViewPlayer = function() {
  var position = this.player.getPosition();
  this.camera.position.x = position.x + 1;
  this.camera.position.y = position.y + 1;
  this.camera.position.z = position.z + 0.2;
  this.camera.lookAt(position);
}

View.prototype.replayPlayer = function() {
  var position = this.player.getPosition();
  var pos = position.x > position.y !== undefined ? position.x : position.y;
  this.camera.position.x = pos - 1;
  this.camera.position.y = pos - 1;
  this.camera.position.z = position.z + 0.2;
  this.camera.lookAt(position);
}

View.prototype.distancePlayer = function() {
  var position = this.player.getPosition();
  this.camera.position.x = position.x - 10;
  this.camera.position.y = position.y;
  this.camera.position.z = position.z + 20;
  this.camera.lookAt(position);
}

View.prototype.setMode = function(mode) {
  this.mode = mode;
}

View.prototype.update = function () {
  if (this.mode === 'follow') {
    this.followPlayer();
  } else if (this.mode === 'rearview') {
    this.rearViewPlayer();
  } else if (this.mode === 'replay') {
    this.replayPlayer();
  } else if (this.mode === 'distance') {
    this.distancePlayer();
  } else {
    this.followPlayer();
  }
};
