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
  this.initWorld();

  // Create cameras
  this.initViews();

  // Create debug renderer
  this.cannonDebugRenderer = new THREE.CannonDebugRenderer(this.scene, this.world);

  // Start game
  this.lastFrame = new Date();
  this.update();
}

Game.prototype.trackPlayerCamera = function(camera, player) {
  var position = player.getPosition();
  position = new THREE.Vector3().copy(position);
  camera.position.x = position.x - 0.5;
  camera.position.y = position.y - 0.5;
  camera.position.z = position.z + 0.3;
  position.z += 0.2;
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
  var that = this;
  // Setup our world
  this.world = new CANNON.World();
  this.world.gravity.set(0, 0, -5.82); // m/s²

  // Create box
  var planes = [
    // Axis, rotation, position
    [1, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, -Math.PI/2, 0, 0, 0],
    [1, 0, 0, Math.PI/2, 0, 63 * 2.5, 0],
    [0, 1, 0, Math.PI/2, 0, 0, 0],
    [0, 1, 0, -Math.PI/2, 63 * 2.5, 0, 0]
  ];

  for (var i = 0; i < planes.length; i++) {
    var d = planes[i];
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({
      mass: 0
    });
    groundBody.addShape(groundShape);
    var rot = new CANNON.Vec3(d[0], d[1], d[2]);
    groundBody.quaternion.setFromAxisAngle(rot, d[3]);
    groundBody.position.x = d[4];
    groundBody.position.y = d[5];
    groundBody.position.z = d[6];
    this.world.add(groundBody);
  }

  // Create players
  this.player1 = new Player(this.scene, this.world);
  this.player2 = new Player(this.scene, this.world);
  this.player1.setPosition(3.0, 2.85, 102.5);
  this.player2.setPosition(2.85, 3.0, 102.5);

  // Create lights
  this.createLights();

  // Create snow
  this.snow1 = new SnowParticles(this.scene, this.player1);
  this.snow2 = new SnowParticles(this.scene, this.player2);

  // Create clouds
  this.createClouds();

  // Create sky
  this.createSky();

  // Create heightmap
  this.heightmap = new Heightmap();
  this.heightmap.imagesToPlane(["levels/map_jump.png", "levels/map_jump_color.png"], this.scene, this.world, function() {
    // Create finish line
    that.createFinishLine();
  });

}

Game.prototype.createSky = function() {
  var imagePrefix = "assets/textures/Skybox-";
  var directions  = ["0", "2", "1", "3", "4", "5"];
  var imageSuffix = ".jpg";
  var skyGeometry = new THREE.CubeGeometry(300, 300, 100);
  var materialArray = [];
  for (var i = 0; i < 6; i++)
  materialArray.push(new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(imagePrefix + directions[i] + imageSuffix),
    side: THREE.BackSide
  }));
  var skyBox = new THREE.Mesh(skyGeometry, materialArray);
  skyBox.position.x = 32 * 2.5;
  skyBox.position.y = 32 * 2.5;
  skyBox.position.z = 50 * 2.5;
  this.scene.add(skyBox);
}

Game.prototype.createFinishLine = function() {
  var that = this;

  var geometry = new THREE.PlaneGeometry(1, 2.2);
  var material = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide});
  this.finishLine = new THREE.Mesh(geometry, material);
  this.finishLine.material.visible = false;
  this.finishLine.position.x = 60 * 2.5;
  this.finishLine.position.y = 60 * 2.5;
  var z = this.heightmap.getHeightFromLayers(60, 60);
  this.finishLine.position.z = z;
  this.finishLine.lookAt(this.finishLine.position.x + 1, this.finishLine.position.y + 1, z);
  this.scene.add(this.finishLine);

  // Load Finish model
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath('assets/models/');
  mtlLoader.load('Finish.mtl', function(materials) {
    materials.preload();
    // Create model
    var objLoader = new THREE.OBJLoader();
    objLoader.setPath('assets/models/');
    objLoader.setMaterials(materials);
    // Load model
    objLoader.load('Finish.obj', function(object) {
      object.castShadow = true;
      object.traverse(function(child) {
        child.castShadow = true;
        if(child.material) {
          child.material.side = THREE.DoubleSide;
        }
      });
      object.scale.set(0.1, 0.1, 0.1);
      object.position.x = 2 * 2.5;
      object.position.y = 2 * 2.5;
      var z = that.heightmap.getHeightFromLayers(2, 2);
      object.position.z = 101.5;
      object.position.z = z - 0.25;
      object.rotation.z = Math.PI / 4;
      that.scene.add(object);

      object = object.clone();
      object.scale.set(0.1, 0.1, 0.1);
      object.position.x = 60 * 2.5;
      object.position.y = 60 * 2.5;
      var z = that.heightmap.getHeightFromLayers(60, 60);
      object.position.z = z - 0.25;
      object.rotation.z = Math.PI / 4;
      that.scene.add(object);
    });
  });
}

Game.prototype.createLights = function() {
  var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  this.scene.add(ambientLight);

  this.light = new THREE.DirectionalLight(0xffffff, 0.3);
  this.light.castShadow = true;
  this.light.shadow.mapSize.width = 8192;
  this.light.shadow.mapSize.height = 8192;
  this.light.shadow.camera.far = 800;
  this.scene.add(this.light);
  this.scene.add(this.light.target);

  var d = 64;
  this.light.shadow.camera.left = -d;
  this.light.shadow.camera.right = d;
  this.light.shadow.camera.top = d;
  this.light.shadow.camera.bottom = -d;

  this.light.position.x = 250;
  this.light.position.y = 200;
  this.light.position.z = 200;

  this.light.target.position.x = 50;
  this.light.target.position.y = 50;
  this.light.target.position.z = 110;

  // var helper = new THREE.CameraHelper(this.light.shadow.camera);
  // this.scene.add(helper);
}

Game.prototype.createClouds = function() {
  var geometry = new THREE.Geometry();

  var texture = new THREE.TextureLoader().load('assets/textures/cloud.png');
  texture.magFilter = THREE.LinearMipMapLinearFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;

  var material = new THREE.MeshBasicMaterial({
    transparent: true,
    map: texture
  });

  var texture = material.map;
  // texture.rotation = -Math.PI / 2;

  for ( var i = 0; i < 50; i++ ) {
    var plane = new THREE.Mesh( new THREE.PlaneGeometry( 10, 10 ), material );

    plane.position.x = Math.random() * 200;
    plane.position.y = Math.random() * 200;
    plane.position.z = 120;
    plane.lookAt(new THREE.Vector3(1, 1, 100));
    plane.scale.x = plane.scale.z = plane.scale.y = Math.random() * Math.random() * 1.5 + 0.5;
    this.scene.add(plane);
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

  // Run simulation
  var fixedTimeStep = 1.0 / 60.0; // seconds
  var maxSubSteps = 3;
  this.world.step(fixedTimeStep, this.delta, maxSubSteps);

  // Make sure players don't fall through the map
  if (this.heightmap.loaded) {
    var players = [this.player1, this.player2];
    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      var position = player.getPosition();
      var groundHeight = this.heightmap.getHeightFromLayers(Math.floor(position.x / 2.5), Math.floor(position.y / 2.5));
      if (position.z < groundHeight - 2) {
        this.player2.setPosition(position.x, position.y, groundHeight + 0.5);
        var velocity = player.getVelocity();
        player.setVelocity(velocity.x, velocity.y, 0.1);
      }
    }
  }

  // Update debug renderer
  // this.cannonDebugRenderer.update();

  // Update snow
  this.snow1.update();
  this.snow2.update();

  // Update players
  this.player1.update();
  this.player2.update();

  // Check finish line
  if (this.finishLine) {
    var collision = this.player1.getCollision(this.finishLine);
    if (collision && collision.distance < 0.1) {
      console.log("Player 1 wins!");
      this.paused = true;
    }
    var collision = this.player2.getCollision(this.finishLine);
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
