'use strict';

function Matrix() {
  this.queue = []; // list of matrixes to apply
}


// params = [a, b, c, d, e, f]
Matrix.prototype.matrix = function(params) {
  this.queue.unshift(params);
};

// params = [angle <, x, y>]
Matrix.prototype.rotate = function(params) {

  var alpha = params[0] * Math.PI / 180;
  var cosa = Math.cos(alpha);
  var sina = Math.sin(alpha);

  if (params.length === 3) {
    // Rotation about point ( params[1], params[2])
    this.translate([ params[1], params[2]]);
    this.queue.unshift([ cosa, sina, -sina, cosa, 0, 0 ]);
    this.translate([ -params[1], -params[2] ]);

  } else {
    // Rotation around (0, 0)
    this.queue.unshift([ cosa, sina, -sina, cosa, 0, 0 ]);
  }
};

// params = [x <, y>]
Matrix.prototype.scale = function(params) {
  this.queue.unshift([ params[0] , 0, 0, (params.length === 2 ? params[1] : params[0]), 0, 0 ]);
};

// params = [angle]
Matrix.prototype.skewX = function(params) {
  this.queue.unshift([ 1, 0, Math.tan(params[0] * Math.PI / 180), 1, 0, 0 ]);
};

// params = [angle]
Matrix.prototype.skewY = function(params) {
  this.queue.unshift([ 1, Math.tan(params[0] * Math.PI / 180), 0, 1, 0, 0 ]);
};

// params = [x <, y>]
Matrix.prototype.translate = function(params) {
  this.queue.unshift([ 1, 0, 0, 1, params[0], (params.length === 2 ? params[1] : 0) ]);
};


// Apply list of matrixes to X,Y point. If isRelative set,
// then `translate` skipped
//
Matrix.prototype.calc = function(x, y, isRelative) {
  var newXY = [x,y];

  this.queue.forEach(function(trans) {
    newXY = [
      newXY[0] * trans[0] + newXY[1] * trans[2] + (isRelative ? 0 : trans[4]),
      newXY[0] * trans[1] + newXY[1] * trans[3] + (isRelative ? 0 : trans[5])
    ];
  });
  return newXY;
};

module.exports = Matrix;
