function SnowParticles(scene, target) {
  this.scene = scene;
  this.target = target;
  this.size = 0.3;
  this.transparent = true;
  this.opacity = 1;
  this.sizeAttenuation = true;
  this.color = 0xffffff;
  this.systems = [];

  this.createPointClouds(this.size, this.transparent, this.opacity, this.sizeAttenuation, this.color);
}

SnowParticles.prototype.createPointCloud = function(name, texture, size, transparent, opacity, sizeAttenuation, color) {
  var geom = new THREE.Geometry();

  var color = new THREE.Color(color);
  // color.setHSL(color.getHSL().h, color.getHSL().s, (Math.random()) * color.getHSL().l);

  var material = new THREE.PointsMaterial({
    size: size,
    transparent: transparent,
    opacity: opacity,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: sizeAttenuation,
    color: color
  });

  var range = 20;
  for (var i = 0; i < 60; i++) {
    var particle = new THREE.Vector3(
      Math.random() * range - range / 2,
      Math.random() * range - range / 2,
      Math.random() * range * 2);
      particle.velocityX = (Math.random() - 0.5) * 0.05;
      particle.velocityY = (Math.random() - 0.5) * 0.05;
      particle.velocityZ = 0.01 + Math.random() * 0.3;
      geom.vertices.push(particle);
    }

    var system = new THREE.Points(geom, material);
    system.name = name;
    system.sortParticles = true;
    return system;
  }

  SnowParticles.prototype.loadTextures = function(sources) {
    var textures = [];
    for (var i = 0; i < sources.length; i++) {
      var texture = new THREE.TextureLoader().load(sources[i]);
      textures.push(texture);
    }
    return textures;
  }

  SnowParticles.prototype.createPointClouds = function(size, transparent, opacity, sizeAttenuation, color) {
    var textures = this.loadTextures([
      "assets/textures/snowflake1.png",
      "assets/textures/snowflake2.png",
      "assets/textures/snowflake3.png",
      "assets/textures/snowflake5.png"
    ]);

    for (var i = 0; i < textures.length; i++) {
      var system = this.createPointCloud("system" + i, textures[i], size, transparent, opacity, sizeAttenuation, color);
      this.scene.add(system);
      this.systems.push(system);
    }
  }

  SnowParticles.prototype.update = function() {
    for (var i = 0; i < this.systems.length; i++) {
      var system = this.systems[i];
      // Target
      var position = this.target.getPosition();
      system.position.x = position.x;
      system.position.y = position.y;
      system.position.z = position.z;
      // Update vertices
      var vertices = system.geometry.vertices;
      vertices.forEach(function (v) {
        v.y = v.y - (v.velocityY);
        v.x = v.x - (v.velocityX);
        v.z = v.z - (v.velocityZ);

        if (v.z <= -10) v.z = 10;
        if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
        if (v.y <= -20 || v.y >= 20) v.velocityY = v.velocityY * -1;
      });
      system.geometry.verticesNeedUpdate = true;
    }
  }
