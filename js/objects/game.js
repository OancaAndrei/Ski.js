function Game() {
  this.scaleFactor = 1;
  this.properties = {
    backgroundColor: 0x4f7790
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

  // Enable shadows
  this.renderer.shadowMap.enabled = true;
  this.renderer.shadowMapSoft = true;

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
  this.world = new World(this.scene);

  // Create cameras
  this.initViews();

  // Create debug renderer
  this.cannonDebugRenderer = new THREE.CannonDebugRenderer(this.scene, this.world);

  // Start game
  this.lastFrame = new Date();
  this.update();
}

Game.prototype.initViews = function() {
  this.views = [
    new View(this.world.getPlayer(0)),
    new View(this.world.getPlayer(1))
  ];
  this.views[0].configure(0, 0, 0.5, 1.0);
  this.views[1].configure(0.5, 0, 0.5, 1.0);
  if (this.replay) {
    this.views[0].setMode('replay');
    this.views[1].setMode('replay');
  } else {
    this.views[0].setMode('follow');
    this.views[1].setMode('follow');
  }
}

Game.prototype.updateViews = function() {
  for (var i = 0; i < this.views.length; i++) {
    var view = this.views[i];
    var camera = view.camera;

    view.update();

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

  // Update world
  this.world.update(this.delta);

  // Check finish line
  if (this.world.finishLine) {
    var collision = this.world.getPlayer(0).getCollision(this.world.finishLine);
    if (collision && collision.distance < 0.1) {
      console.log("Player 1 wins!");
      this.paused = true;
    }
    var collision = this.world.getPlayer(1).getCollision(this.world.finishLine);
    if (collision && collision.distance < 0.1) {
      console.log("Player 2 wins!");
      this.paused = true;
    }
  }

  // Render scene
  this.updateViews();

  // Update game time
  this.lastFrame = this.currentFrame;

  // End stats
  this.stats.end();

  // Request next frame
  if (!this.paused) {
    var game = this;
    this.animationFrameId = requestAnimationFrame(function() { game.update(); });
  }
}

Game.prototype.stop = function() {
  cancelAnimationFrame(this.animationFrameId);
  window.removeEventListener('resize', this.onWindowResizeCallback);
  window.removeEventListener('mousemove', this.onMouseMoveCallback);
  window.removeEventListener('touchmove', this.onTouchMoveCallback);
  this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
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
