function Game() {
  this.scaleFactor = 1;
  this.properties = {
    backgroundColor: 0xffffff
  };
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.replay = false;
};

Game.prototype.init = function() {
  // Create scene
  this.scene = new THREE.Scene();
  this.scene.background = new THREE.Color(this.properties.backgroundColor);

  // Create renderer
  this.renderer = new THREE.WebGLRenderer();
  this.renderer.setSize(window.innerWidth * this.scaleFactor, window.innerHeight * this.scaleFactor, false);
  this.renderer.domElement.id = "gameview";
  $("body").append(this.renderer.domElement);

  // Create stats
  this.stats = new Stats();
  this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(this.stats.dom);

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

  // Create world
  this.initWorld();

  // Create cameras
  this.initViews();

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

Game.prototype.trackPlayerCamera = function(camera, player) {
  var position = player.getPosition();
  camera.position.x = position.x - 1;
  camera.position.y = position.y - 1;
  camera.position.z = position.z + 0.2;
  camera.lookAt(position);
}

Game.prototype.frontPlayerCamera = function(camera, player) {
  var position = player.getPosition();
  camera.position.x = position.x + 1;
  camera.position.y = position.y + 1;
  camera.position.z = position.z + 0.2;
  camera.lookAt(position);
}

Game.prototype.replayPlayerCamera = function(camera, player) {
  var position = player.getPosition();
  var pos = position.x > position.y ? position.x : position.y;
  camera.position.x = pos - 1;
  camera.position.y = pos - 1;
  camera.position.z = position.z + 0.2;
  camera.lookAt(position);
}

Game.prototype.distancePlayerCamera = function(camera, player) {
  var position = player.getPosition();
  camera.position.x = position.x - 10;
  camera.position.y = position.y;
  camera.position.z = position.z + 20;
  camera.lookAt(position);
}

Game.prototype.initViews = function() {
  var that = this;
  this.views = [
    {
      left: 0,
      top: 0,
      width: 0.5,
      height: 1.0,
      up: [ 0, 0, 1 ],
      fov: 45,
      background: new THREE.Color(1, 1, 1),
      updateCamera: function (camera) {
        if (that.replay) {
          // Replay camera
          that.replayPlayerCamera(camera, that.player1);
        } else {
          // Track player camera
          that.trackPlayerCamera(camera, that.player1);
        }
      }
    },
    {
      left: 0.5,
      top: 0,
      width: 0.5,
      height: 1.0,
      up: [ 0, 0, 1 ],
      fov: 45,
      background: new THREE.Color(1, 1, 1),
      updateCamera: function (camera) {
        if (that.replay) {
          // Replay camera
          that.replayPlayerCamera(camera, that.player2);
        } else {
          // Track player camera
          that.trackPlayerCamera(camera, that.player2);
        }
      }
    }
  ];
  for (var i =  0; i < this.views.length; i++) {
    var view = this.views[i];
    var camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.up.fromArray(view.up);
    view.camera = camera;
  }
}

Game.prototype.updateViews = function() {
  for (var i = 0; i < this.views.length; i++) {
    var view = this.views[i];
    var camera = view.camera;

    view.updateCamera(camera);

    var left = Math.floor(this.width * view.left);
    var top = Math.floor(this.height * view.top);
    var width = Math.floor(this.width * view.width);
    var height = Math.floor(this.height * view.height);

    this.renderer.setViewport(left, top, width, height);
    this.renderer.setScissor(left, top, width, height);
    this.renderer.setScissorTest(true);
    this.renderer.setClearColor(view.background);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    this.renderer.render(this.scene, camera);
  }
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

  this.player1.setPosition(2.65, 2.5, 102);
  this.player2.setPosition(2.5, 2.75, 102);

  // Create heightmap
  var heightmap = new Heightmap();
  heightmap.imagesToPlane(["levels/map_jump.png", "levels/alpha.png"], this.scene, this.world);
}

Game.prototype.reset = function() {
}

Game.prototype.end = function() {
}

Game.prototype.update = function() {
  // Start stats
  this.stats.begin();

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

  // Render scene
  // this.renderer.render(this.scene, this.camera);
  this.updateViews();

  // Update game time
  this.lastFrame = this.currentFrame;

  // End stats
  this.stats.end();

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

Game.prototype.onWindowResize = function() {
  this.width = window.innerWidth;
  this.height = window.innerHeight;
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
