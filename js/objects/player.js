function Player(scene, world) {
  this.scene = scene;
  this.world = world;
  this.radius = 0.1;
  this.force = 8;

  this.createBody();
  this.createModel();
}

Player.prototype.createModel = function() {
  // Create mesh
  var geometry = new THREE.SphereGeometry(this.radius, 32, 32 );
  var material = new THREE.MeshLambertMaterial({color: 0xffff00});
  this.mesh = new THREE.Mesh(geometry, material);
  this.scene.add(this.mesh);
}

Player.prototype.createBody = function() {
  // Create a sphere
  this.body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 0, 0),
    shape: new CANNON.Sphere(this.radius)
  });
  this.world.addBody(this.body);
}

Player.prototype.setPosition = function(x, y, z) {
  this.body.position.set(x, y, z);
}

Player.prototype.getPosition = function() {
  return this.mesh.position;
  // If you're wondering why I haven't used the body's position
  // it's because it won't work, for unknown reasons
}

Player.prototype.applyForce = function(x, y, z) {
  this.body.applyForce(new CANNON.Vec3(x, y, z), this.body.position);
}

Player.prototype.sprint = function() {
  var currentDirection = vec2.fromValues(this.body.velocity.x, this.body.velocity.y);
  vec2.normalize(currentDirection, currentDirection);
  vec2.scale(currentDirection, currentDirection, this.force);
  this.applyForce(currentDirection[0], currentDirection[1], 0);
}

Player.prototype.applyForceSideways = function(force) {
  var currentDirection = vec3.fromValues(this.body.velocity.x, this.body.velocity.y, 0);
  var verticalDirection = vec3.fromValues(0, 0, 1);
  vec3.cross(currentDirection, currentDirection, verticalDirection);

  vec2.normalize(currentDirection, currentDirection);
  vec2.scale(currentDirection, currentDirection, force);
  this.applyForce(currentDirection[0], currentDirection[1], 0);
}

Player.prototype.leanLeft = function() {
  this.applyForceSideways(-this.force);
}

Player.prototype.leanRight = function() {
  this.applyForceSideways(this.force);
}

Player.prototype.jump = function() {
  this.body.applyImpulse(new CANNON.Vec3(0, 0, 1), this.body.position);
}

Player.prototype.update = function() {
  // Update mesh position
  var position = this.body.position;
  this.mesh.position.x = position.x;
  this.mesh.position.y = position.y;
  this.mesh.position.z = position.z;
}
