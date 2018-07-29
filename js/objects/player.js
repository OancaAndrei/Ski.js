function Player(scene, world) {
  this.scene = scene;
  this.world = world;
  this.radius = 0.1;
  this.force = 8;

  this.createBody();
  this.createModel();
  this.createLight();
}

Player.prototype.createModel = function() {
  var that = this;
  // Load material
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath('assets/models/');
  mtlLoader.load('Snowman.mtl', function(materials) {
    materials.preload();
    // Create model
    var objLoader = new THREE.OBJLoader();
    objLoader.setPath('assets/models/');
    objLoader.setMaterials(materials);
    // Load model
    objLoader.load('Snowman.obj', function(object) {
        that.mesh = object;
        that.mesh.traverse(function(child) {
          child.castShadow = true;
        });
        object.scale.set(0.05, 0.05, 0.05);
        that.scene.add(object);
      },
      function(xhr) {
        console.log((xhr.loaded / xhr.total * 100 ) + '% loaded');
      },
      function(error) {
        console.log('An error happened:', error);
      }
    );
  });
}

Player.prototype.createLight = function() {
  this.light = new THREE.DirectionalLight(0xffffff, 0.125);
  this.light.castShadow = true;
  this.light.shadow.mapSize.width = 512;
  this.light.shadow.mapSize.height = 512;
  this.light.shadow.camera.far = 50;
  this.scene.add(this.light);
  this.scene.add(this.light.target);
  // var helper = new THREE.CameraHelper(this.light.shadow.camera);
  // this.scene.add(helper);
}

Player.prototype.createBody = function() {
  // Create a sphere
  this.body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 0, 0),
    shape: new CANNON.Sphere(this.radius)
  });
  this.body.linearDamping = 0.1;
  this.world.addBody(this.body);
}

Player.prototype.setPosition = function(x, y, z) {
  this.body.position.set(x, y, z);
}

Player.prototype.getPosition = function() {
  if (!this.mesh) return {x: 0, y: 0, z: 0};
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

Player.prototype.getMeshRotation = function() {
  var currentDirection = vec3.fromValues(this.body.velocity.x, this.body.velocity.y, 0);
  var meshDirection = vec3.fromValues(1, 0, 0);
  var angle = vec3.angle(currentDirection, meshDirection);

  // Fix sign
  var cross = vec3.create();
  var plane = vec3.fromValues(0, 0, 1);
  vec3.cross(cross, meshDirection, currentDirection);
  var sign = vec3.dot(plane, cross);
  angle *= Math.sign(sign);

  return angle;
}

Player.prototype.update = function() {
  // Update mesh position
  var position = this.body.position;
  if (this.mesh) {
    this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = position.z - this.radius;
    this.mesh.rotation.z = this.getMeshRotation();
  }

  this.light.position.x = position.x;
  this.light.position.y = position.y;
  this.light.position.z = position.z + 10;

  this.light.target.position.x = position.x;
  this.light.target.position.y = position.y;
  this.light.target.position.z = position.z - 10;
}
