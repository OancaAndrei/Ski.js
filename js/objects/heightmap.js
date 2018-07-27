function Heightmap() {
}

Heightmap.prototype.fromImage = function(image, scale, channels) {
  channels = channels ? channels : [0, 1, 2];
  scale = scale ? scale : 1;
  // Create temp canvas
  var canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  var context = canvas.getContext('2d');
  // Create data container
  var size = image.width * image.height;
  var data = new Float32Array(size);
  // Get image data
  context.drawImage(image, 0, 0);
  var imageData = context.getImageData(0, 0, image.width, image.height);
  var pixels = imageData.data;
  // Set data to zero
  for (var i = 0; i < size; i++) {
    data[i] = 0;
  }
  // Convert RGB to height
  for (var i = 0, j = 0; i < pixels.length; i += 4) {
    var sum = 0;
    for (var k = 0; k < channels.length; k++) {
      sum += pixels[i + channels[k]];
    }
    data[j++] = sum / (255 * channels.length) * scale;
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

    // Create plane
    var size = 64;
    var geometry = new THREE.PlaneGeometry(size, size, size - 1, size - 1);
    var texture = new THREE.TextureLoader().load(sources[1]);
    var alpha = new THREE.TextureLoader().load(sources[2]);
    var material = new THREE.MeshBasicMaterial({map: texture});
    // material.side = THREE.DoubleSide;
    var plane = new THREE.Mesh(geometry, material);
    plane.position.x = size;
    plane.position.y = size;
    plane.rotation.z = Math.PI / 2;
    plane.scale.x = 2;
    plane.scale.y = 2;
    // plane.scale.z = 2;

    // Set height of vertices
    for (var i = 0; i < plane.geometry.vertices.length; i++) {
      plane.geometry.vertices[i].z = data[i];
    }

    scene.add(plane);

    var heights = [];
    for (var i = 0; i < size; i++) {
      heights.push([]);
      for (var j = 0; j < size; j++) {
        heights[i].push(data[i * size + j]);
      }
    }

    // console.log(JSON.stringify(heights));

    // Create physic body
    var heightfieldShape = new CANNON.Heightfield(heights, {
      elementSize: 2
    });
    var heightfieldBody = new CANNON.Body({ mass: 0 });
    heightfieldBody.addShape(heightfieldShape);
    world.addBody(heightfieldBody);
  });
}
