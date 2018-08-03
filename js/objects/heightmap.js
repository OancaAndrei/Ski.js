function Heightmap() {
}

Heightmap.prototype.getChannels = function(image, channels) {
  // Create temp canvas
  var canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  var context = canvas.getContext('2d');
  // Create data container
  var size = image.width * image.height;
  var data = [];
  for (var k = 0; k < channels.length; k++) {
    data[k] = new Float32Array(size)
  }
  // Get image data
  context.drawImage(image, 0, 0);
  var imageData = context.getImageData(0, 0, image.width, image.height);
  var pixels = imageData.data;
  // Set data to zero
  for (var i = 0; i < size; i++) {
    for (var k = 0; k < channels.length; k++) {
      data[k][i] = 0;
    }
  }
  // Split channels to layers
  for (var i = 0, j = 0; i < pixels.length; i += 4) {
    var sum = 0;
    for (var k = 0; k < channels.length; k++) {
      data[k][j] = pixels[i + channels[k]] / 255.0;
    }
    j++;
  }
  return {width: image.width, height: image.height, data: data};
}

Heightmap.prototype.loadImages = function(sources, callback) {
  var loadedImages = [];
  var imageLoaded = function(image) {
    loadedImages.push(image);
    if (loadedImages.length === sources.length) {
      callback(loadedImages);
    }
  };
  for (var i = 0; i < sources.length; i++) {
    var image = new Image();
    image.onload = function () {
      imageLoaded(this);
    };
    image.src = sources[i];
  }
}

Heightmap.prototype.mergeLayers = function(layers, merge) {
  if (layers.length <= 0) return;
  var finalHeightmap = [];
  for (var i = 0; i < layers[0].length; i++) {
    var data = [];
    for (var j = 0; j < layers.length; j++) {
      data[j] = layers[j][i];
    }
    finalHeightmap[i] = merge(data);
  }
  return finalHeightmap;
}

Heightmap.prototype.arrayToHeight = function(array, size) {
  var heights = [];
  for (var i = 0; i < size; i++) {
    heights.push([]);
    for (var j = 0; j < size; j++) {
      heights[i].push(array[i * size + j]);
    }
  }
  return heights;
}

Heightmap.prototype.getHeightFromLayers = function(x, y) {
  var data = [];
  for (var j = 0; j < this.layers.length; j++) {
    data[j] = this.layers[j][y * this.size + x];
  }
  return 5 * data[0] - 10 * (1 - data[2]) + 97;
}

Heightmap.prototype.imagesToPlane = function(sources, scene, world, callback) {
  var that = this;
  this.world = world;
  this.scene = scene;
  this.loadImages(sources, function(images) {
    // Get height data from images
    var channels = that.getChannels(images[0], [0, 1, 2]);
    that.layers = channels.data;
    that.size = channels.width;
    var valley = that.layers[0];
    var track = that.layers[1];
    var jumps = that.layers[2];

    var data = that.mergeLayers([valley, track, jumps], function(data) {
      var extra = data[1] === 0 ? 1 : 0;
      return 5 * data[0] - 3 * data[1] + extra - 10 * (1 - data[2]) * data[1] + 100;
    });

    // Create physic body
    var heightfieldShape = new CANNON.Heightfield(that.arrayToHeight(data, 64), {
      elementSize: 2.5
    });
    var heightfieldBody = new CANNON.Body({ mass: 0 });
    heightfieldBody.addShape(heightfieldShape);
    world.addBody(heightfieldBody);

    // Create plane
    var texture = new THREE.TextureLoader().load(sources[1]);
    var material = new THREE.MeshPhongMaterial({map: texture});

    // Create plane from physic body
    var geometry = new THREE.Geometry();
    var v0 = new CANNON.Vec3();
    var v1 = new CANNON.Vec3();
    var v2 = new CANNON.Vec3();
    var shape = heightfieldShape;
    for (var xi = 0; xi < shape.data.length - 1; xi++) {
      for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
        for (var k = 0; k < 2; k++) {
          shape.getConvexTrianglePillar(xi, yi, k === 0);
          v0.copy(shape.pillarConvex.vertices[0]);
          v1.copy(shape.pillarConvex.vertices[1]);
          v2.copy(shape.pillarConvex.vertices[2]);
          v0.vadd(shape.pillarOffset, v0);
          v1.vadd(shape.pillarOffset, v1);
          v2.vadd(shape.pillarOffset, v2);
          geometry.vertices.push(
            new THREE.Vector3(v0.x, v0.y, v0.z),
            new THREE.Vector3(v1.x, v1.y, v1.z),
            new THREE.Vector3(v2.x, v2.y, v2.z)
          );
          var i = geometry.vertices.length - 3;
          geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
        }
      }
    }
    geometry.computeBoundingSphere();
    geometry.computeFaceNormals();
    geometry.computeBoundingBox();

    // Calculate UV map
    var max = geometry.boundingBox.max,
    min = geometry.boundingBox.min;
    var offset = new THREE.Vector2(0, 0);
    var range = new THREE.Vector2(max.x, max.y);
    var faces = geometry.faces;
    geometry.faceVertexUvs[0] = [];
    for (var i = 0; i < faces.length; i++) {
      var v1 = geometry.vertices[faces[i].a],
      v2 = geometry.vertices[faces[i].b],
      v3 = geometry.vertices[faces[i].c];
      geometry.faceVertexUvs[0].push([
        new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
        new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
        new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
      ]);
    }
    geometry.uvsNeedUpdate = true;

    // Rotate texture
    var texture = material.map;
    texture.offset.set(0, 0);
    texture.center.set(0.5, 0.5);
    texture.repeat.set(1, 1);
    texture.rotation = Math.PI / 2;

    // Create mesh
    mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Place obstacles
    that.placeObstacles();

    // Callback
    callback();
  });
}

Heightmap.prototype.placeObstacles = function() {
  var that = this;
  // Get track min and max x for every y
  var track = this.layers[1];
  var ys = [];
  for (var y = 0; y < this.size; y++) {
    var min = -1;
    for (var x = 0; x < this.size; x++) {
      var isTrack = track[y * this.size + x] > 0.05;
      if (isTrack && min === -1) {
        min = x + 0;
      }
      if (!isTrack && min !== -1) {
        ys[y] = [min + 0, x + 0];
        break;
      }
    }
    if (ys[y] === undefined) {
      ys[y] = [min + 0, this.size -1];
    }
  }
  // Create obstacles
  var obstacles = [];
  for (var y = 0; y < ys.length; y++) {
    if (ys[y].length === 0) continue;
    // Coordinates are flipped
    var y1 = ys[y][0];
    var y2 = ys[y][1];
    var x = y;
    // Randomize position
    var middle = (y1 + y2) / 2;
    var width = middle - y1;
    var randomY = width * (Math.random() - 0.5) + middle;
    // Get height
    var z = this.getHeightFromLayers(x, Math.round(randomY));
    // Random model
    var model = Math.random() >= 0.7 ? 0 : 1;
    // Create shape
    var shape;
    if (model === 0) {
      shape = new CANNON.Sphere(0.5);
    } else {
      shape = new CANNON.Cylinder(0.1, 0.1, 2, 3);
    }
    // Create body
    var body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(x * 2.5, randomY * 2.5, z),
      shape: shape
    });
    this.world.addBody(body);
    // Save position
    obstacles.push([x * 2.5, randomY * 2.5, z, model]);
  }
  // Load models
  var models = [];
  var counter = 2;
  var onModelLoaded = function(model, type) {
    models[type] = model;
    counter--;
    if (counter === 0) {
      for (var i = 0; i < obstacles.length; i++) {
        var type = obstacles[i][3];
        var mesh = models[type].clone();
        mesh.castShadow = true;
        mesh.traverse(function(child) {
          child.castShadow = true;
        });
        if (type === 0) {
          mesh.scale.set(0.6, 0.6, 0.6); // Rock
        } else {
          mesh.scale.set(0.2, 0.2, 0.2); // Tree
        }
        mesh.position.x = obstacles[i][0];
        mesh.position.y = obstacles[i][1];
        mesh.position.z = obstacles[i][2];
        // Rotate rock
        if (type === 0) {
          mesh.rotation.x = Math.random();
          mesh.rotation.y = Math.random();
          mesh.rotation.z = Math.random();
        }
        that.scene.add(mesh);
      }
    }
  }
  // Load Rock model
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath('assets/models/');
  mtlLoader.load('Rock.mtl', function(materials) {
    materials.preload();
    // Create model
    var objLoader = new THREE.OBJLoader();
    objLoader.setPath('assets/models/');
    objLoader.setMaterials(materials);
    // Load model
    objLoader.load('Rock.obj', function(object) {
      onModelLoaded(object, 0);
    });
  });
  // Load Tree model
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath('assets/models/');
  mtlLoader.load('Tree.mtl', function(materials) {
    materials.preload();
    // Create model
    var objLoader = new THREE.OBJLoader();
    objLoader.setPath('assets/models/');
    objLoader.setMaterials(materials);
    // Load model
    objLoader.load('Tree.obj', function(object) {
      onModelLoaded(object, 1);
    });
  });
}
