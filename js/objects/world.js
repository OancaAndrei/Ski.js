function World(scene) {
  this.scene = scene;
  this.raycaster = new THREE.Raycaster();

  this.initWorld();
}

World.prototype.initWorld = function() {
  var that = this;

  // Setup physical world
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
  this.players = [];
  this.players[0] = new Player(this.scene, this.world);
  this.players[1] = new Player(this.scene, this.world);
  this.players[0].setPosition(3.0, 2.85, 102.5);
  this.players[1].setPosition(2.85, 3.0, 102.5);

  // Create lights
  this.createLights();

  // Create snow
  this.snow = [];
  for (var i = 0; i < this.players.length; i++) {
    this.snow[i] = new SnowParticles(this.scene, this.players[i]);
  }

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


World.prototype.createSky = function() {
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

World.prototype.createFinishLine = function() {
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

World.prototype.createLights = function() {
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

World.prototype.createClouds = function() {
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

World.prototype.getPlayer = function(position) {
  return this.players[position];
}

World.prototype.update = function(delta) {
  // Run simulation
  var fixedTimeStep = 1.0 / 60.0; // seconds
  var maxSubSteps = 3;
  this.world.step(fixedTimeStep, delta, maxSubSteps);

  // Make sure players don't fall through the map
  if (this.heightmap.loaded) {
    for (var i = 0; i < this.players.length; i++) {
      var player = this.players[i];
      var position = player.getPosition();
      var point = player.getPosition();
      point.z = 200;
      this.raycaster.set(point, new THREE.Vector3(0, 0, -1)); // Point to the ground
      var intersection = this.raycaster.intersectObject(this.heightmap.mesh)[0];
      if (intersection && position.z < intersection.point.z - 0.1) {
        player.setPosition(position.x, position.y, intersection.point.z + 0.2);
        var velocity = player.getVelocity();
        player.setVelocity(velocity.x, velocity.y, 0.1);
      }
    }
  }

  // Update debug renderer
  // this.cannonDebugRenderer.update();

  // Update players and snow
  for (var i = 0; i < this.players.length; i++) {
    this.players[i].update();
    this.snow[i].update();
  }
}
