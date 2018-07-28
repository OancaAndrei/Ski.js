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
  return data;
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

Heightmap.prototype.imagesToPlane = function(sources, scene, world) {
  var that = this;
  this.loadImages(sources, function(images) {
    // Get height data from images
    // var valley = that.fromImage(images[0], 1, [0]);
    var valley = that.fromImage(images[1], 1, [0]);
    var track = that.fromImage(images[1], 1, [1]);

    var data = that.mergeLayers([valley, track], function(data) {
      var extra = data[1] === 0 ? 1 : 0;
      return 5 * data[0] - 2 * data[1] + extra;
    });

    // Create physic body
    var size = 64;
    var heights = [];
    for (var i = 0; i < size; i++) {
      heights.push([]);
      for (var j = 0; j < size; j++) {
        heights[i].push(data[i * size + j]);
      }
    }
    var heightfieldShape = new CANNON.Heightfield(heights, {
      elementSize: 2.5
    });
    var heightfieldBody = new CANNON.Body({ mass: 0 });
    heightfieldBody.addShape(heightfieldShape);
    world.addBody(heightfieldBody);

    // Create plane
    var texture = new THREE.TextureLoader().load(sources[0]);
    var alpha = new THREE.TextureLoader().load(sources[1]);
    var material = new THREE.MeshBasicMaterial({map: texture, alphaMap: alpha});

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
    scene.add(mesh);
  });
}
