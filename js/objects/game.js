function Game() {
  this.scaleFactor = 1;
  this.properties = {
    backgroundColor: 0xffffff
  };
};

Game.prototype.init = function() {
  // Create scene
  this.scene = new THREE.Scene();
  this.scene.background = new THREE.Color(this.properties.backgroundColor);

  // Create camera
  this.camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 10000);
  this.camera.up.set(0, 0, 1);
  this.camera.position.x = 1;
  this.camera.position.y = 1;
  this.camera.position.z = 1;
  this.camera.lookAt(0,0,0);

  // Create renderer
  this.renderer = new THREE.WebGLRenderer();
  this.renderer.setSize(window.innerWidth * this.scaleFactor, window.innerHeight * this.scaleFactor, false);
  this.renderer.domElement.id = "gameview";
  $("body").append(this.renderer.domElement);

  var that = this;
  // Register window resize event
  window.addEventListener('resize', this.onWindowResizeCallback = function(e) {
    that.onWindowResize(e);
  }, false);
  // Register mouse move event
  window.addEventListener('mousemove', this.onMouseMoveCallback = function(e) {
    that.onMouseMove(e);
  }, false);
  // Register touch move event
  window.addEventListener('touchmove', this.onTouchMoveCallback = function(e) {
    that.onTouchMove(e);
  }, false);

  this.initWorld();

  // Create debug renderer
  this.cannonDebugRenderer = new THREE.CannonDebugRenderer(this.scene, this.world);

  // Add light
  var ambientLight = new THREE.AmbientLight( 0x111111 );
  this.scene.add( ambientLight );

  var lights = [];
  lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
  lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
  lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

  lights[ 0 ].position.set( 0, 200, 0 );
  lights[ 1 ].position.set( 100, 200, 100 );
  lights[ 2 ].position.set( - 100, - 200, - 100 );

  this.scene.add( lights[ 0 ] );
  this.scene.add( lights[ 1 ] );
  this.scene.add( lights[ 2 ] );

  // Start game
  this.lastFrame = new Date();
  this.update();
}

Game.prototype.initWorld = function() {

  // Setup our world
  this.world = new CANNON.World();
  this.world.gravity.set(0, 0, -5.82); // m/s²

  // Create a plane
  var groundBody = new CANNON.Body({
    mass: 0 // mass == 0 makes the body static
  });
  var groundShape = new CANNON.Plane();
  groundBody.addShape(groundShape);
  this.world.addBody(groundBody);

  // Create players
  this.player1 = new Player(this.scene, this.world);
  this.player2 = new Player(this.scene, this.world);

  this.player1.setPosition(0.5, 0.5, 5);
  this.player2.setPosition(0.55, 0.75, 5);

  // Create heightmap
  var heightmap = new Heightmap();
  heightmap.imagesToPlane(["levels/heightmap.png", "levels/map.png", "levels/alpha.png"], this.scene, this.world);
}

Game.prototype.reset = function() {
}

Game.prototype.end = function() {
}

Game.prototype.update = function() {
  // Update game time
  this.currentFrame = new Date();
  this.delta = (this.currentFrame - this.lastFrame) / 1000;

  // Run simulation
  var fixedTimeStep = 1.0 / 60.0; // seconds
  var maxSubSteps = 3;
  this.world.step(fixedTimeStep, this.delta, maxSubSteps);

  // Update debug renderer
  // this.cannonDebugRenderer.update();

  // Update players
  this.player1.update();
  this.player2.update();

  // Update camera
  this.updateCamera();

  // Render scene
  this.renderer.render(this.scene, this.camera);

  // Update game time
  this.lastFrame = this.currentFrame;

  // Request next frame
  var game = this;
  this.animationFrameId = requestAnimationFrame(function() { game.update(); });
}

Game.prototype.stop = function() {
  cancelAnimationFrame(this.animationFrameId);
  window.removeEventListener('resize', this.onWindowResizeCallback);
  window.removeEventListener('mousemove', this.onMouseMoveCallback);
  window.removeEventListener('touchmove', this.onTouchMoveCallback);
  this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
}

Game.prototype.applyForce = function(x, y, z) {
  this.player1.applyForce(x, y, z);
  this.player2.applyForce(x, y, z);
}

Game.prototype.sprint = function() {
  this.player1.sprint();
  this.player2.sprint();
}

Game.prototype.leanLeft = function() {
  this.player1.leanLeft();
  this.player2.leanLeft();
}

Game.prototype.leanRight = function() {
  this.player1.leanRight();
  this.player2.leanRight();
}

Game.prototype.jump = function() {
  this.player1.jump();
  this.player2.jump();
}

Game.prototype.updateCamera = function() {
  // Follow player1
  var position = this.player1.getPosition();
  this.camera.position.x = position.x - 15;
  this.camera.position.y = position.y;
  this.camera.position.z = position.z + 10;
  this.camera.lookAt(position);
}

Game.prototype.onWindowResize = function() {
  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(window.innerWidth * this.scaleFactor, window.innerHeight * this.scaleFactor, false);
}

Game.prototype.onMouseMove = function(event) {
  this.mouseX = event.pageX / window.innerWidth;
  this.mouseY = event.pageY / window.innerHeight;
}

Game.prototype.onTouchMove = function(event) {
  event.preventDefault();
  event.stopPropagation();

  this.mouseX = event.touches[0].pageX / window.innerWidth;
  this.mouseY = event.touches[0].pageY / window.innerHeight;
}
