'use strict';

// combine 2 matrixes
// m1, m2 - [a, b, c, d, e, g]
//
function combine(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
}


function Matrix() {
  if (!(this instanceof Matrix)) { return new Matrix(); }
  this.queue = [];   // list of matrixes to apply
  this.cache = null; // combined matrix cache
}


Matrix.prototype.matrix = function (params) {
  this.cache = null;
  this.queue.push(params);
  return this;
};


Matrix.prototype.translate = function (tx, ty) {
  if (tx !== 0 || ty !== 0) {
    this.cache = null;
    this.queue.push([ 1, 0, 0, 1, tx, ty ]);
  }
  return this;
};


Matrix.prototype.scale = function (sx, sy) {
  if (sx !== 1 || sy !== 1) {
    this.cache = null;
    this.queue.push([ sx, 0, 0, sy, 0, 0 ]);
  }
  return this;
};


Matrix.prototype.rotate = function (angle, rx, ry) {
  var rad, cos, sin;

  if (angle !== 0) {
    this.translate(rx, ry);

    rad = angle * Math.PI / 180;
    cos = Math.cos(rad);
    sin = Math.sin(rad);

    this.queue.push([ cos, sin, -sin, cos, 0, 0 ]);
    this.cache = null;

    this.translate(-rx, -ry);
  }
  return this;
};


Matrix.prototype.skewX = function (angle) {
  if (angle !== 0) {
    this.cache = null;
    this.queue.push([ 1, 0, Math.tan(angle * Math.PI / 180), 1, 0, 0 ]);
  }
  return this;
};


Matrix.prototype.skewY = function (angle) {
  if (angle !== 0) {
    this.cache = null;
    this.queue.push([ 1, Math.tan(angle * Math.PI / 180), 0, 1, 0, 0 ]);
  }
  return this;
};


// Apply list of matrixes to (x,y) point.
// If `isRelative` set, `translate` component of matrix will be skipped
//
Matrix.prototype.calc = function (x, y, isRelative) {
  var matrix, i, len;

  // Don't change point on empty transforms queue
  if (!this.queue.length) { return [ x, y ]; }

  // Calculate final matrix, if not exists
  //
  // NB. if you deside to apply transforms to point one-by-one,
  // they should be taken in reverse order

  if (!this.cache) {
    this.cache = this.queue[0];
    for (i = 1, len = this.queue.length; i < len; i++) {
      this.cache = combine(this.cache, this.queue[i]);
    }
  }

  matrix = this.cache;

  // Apply matrix to point
  return [
    x * matrix[0] + y * matrix[2] + (isRelative ? 0 : matrix[4]),
    x * matrix[1] + y * matrix[3] + (isRelative ? 0 : matrix[5])
  ];
};


module.exports = Matrix;
