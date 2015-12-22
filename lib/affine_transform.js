'use strict';

// compose 2 matrices representing affine transforms
// if [Li,Ti] with
//    Li 2x2 matrix (the linear part) encoded by [m[0] m[2]]
//                                               [m[1] m[3]]
//    and Ti 1x2 matrix (the translation part) encoded by [m[4]]
//                                                        [m[5]]
//  then m1 x m2 = [L1*L2, L1*A2+A1]
//
function compose(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
}


// Class constructor
//  the parameter could be :
//    - an array : [a, c, b, d, tx, ty]
//      if the array is not complete it is completed by the missing elements of the identity
//      for example
//        - AffineTransform([]) or AffineTransform() creates the identity
//        - AffineTransform([a b c d]) creates a linear transform (translation part = [0 0])
//    - a string : "a c b d tx ty" then it is parsed to an array (and completed if needed)
//    - another AffineTransform : it is copied
//    - empty or something else : the identity transform is created
//
function AffineTransform(m) {
  if (!(this instanceof AffineTransform)) { return new AffineTransform(m); }
  // make the paramyter array if it is not
  if (!m) {
    // if m is empty, it becomes empty array
    m = [];
  } else {
    switch (m.constructor) {
      case String :
        m = m.trim().split(/\s+/).map(parseFloat);
        break;
      case AffineTransform :
        m = m.toArray();
        break;
      case Array :
        break;
      default:
        m = [];
    }
  }
  // complete the matrix by identity
  this.matrix = m.slice().concat([ 1, 0, 0, 1, 0, 0 ].slice(m.length));
}

// return true if the transform is identity
//
AffineTransform.prototype.isIdentity = function (epsilon) {
  if (epsilon) {
    return ((this.matrix[0] - 1) * (this.matrix[0] - 1) +
             this.matrix[1] * this.matrix[1] +
             this.matrix[2] * this.matrix[2] +
            (this.matrix[3] - 1) * (this.matrix[3] - 1) +
             this.matrix[4] * this.matrix[4] +
             this.matrix[5] * this.matrix[5]) < epsilon;
  }

  return (this.matrix[0] === 1 && this.matrix[1] === 0 && this.matrix[2] === 0 && this.matrix[3] === 1) &&
           (this.matrix[4] === 0 && this.matrix[5] === 0);
};

// set the transform to identity
//
AffineTransform.prototype.reset = function () {
  this.matrix = [ 1, 0, 0, 1, 0, 0 ];

  return this;
};


// compose (multiply on the left) by at
//
AffineTransform.prototype.compose = function (at) {
  if (!at || at.constructor !== AffineTransform) {
    at = new AffineTransform(at);
  }

  if (at.isIdentity()) {
    return this;
  }

  this.matrix = compose(at.matrix, this.matrix);

  return this;
};

// compose (multiply on the left) by a translation
//
AffineTransform.prototype.translate = function (tx, ty) {
  this.matrix[4] += tx;
  this.matrix[5] += ty;
  return this;
};

// compose (multiply on the left) by a scale (diagonal matrix)
//
AffineTransform.prototype.scale = function (sx, sy) {
  if (sx !== 1 || sy !== 1) {
    this.matrix[0]  *= sx; this.matrix[2]  *= sx; this.matrix[4]  *= sx;
    this.matrix[1]  *= sy; this.matrix[3]  *= sy; this.matrix[5]  *= sy;
  }
  return this;
};

// compose (multiply on the left) by a rotation (diagonal matrix)
//
AffineTransform.prototype.rotate = function (angle, rx, ry) {
  var rad, cos, sin;

  if (angle !== 0) {
    rad = angle * Math.PI / 180;
    cos = Math.cos(rad);
    sin = Math.sin(rad);

    this
      .translate(-rx, -ry)
      .compose([ cos, sin, -sin, cos, 0, 0 ])
      .translate(rx, ry);
  }
  return this;
};

// compose (multiply on the left) by a skewW matrix
//
AffineTransform.prototype.skewX = function (angle) {
  if (angle !== 0) {
    this.compose([ 1, 0, Math.tan(angle * Math.PI / 180), 1, 0, 0 ]);
  }

  return this;
};


// compose (multiply on the left) by a skewY matrix
//
AffineTransform.prototype.skewY = function (angle) {
  if (angle !== 0) {
    this.compose([ 1, Math.tan(angle * Math.PI / 180), 0, 1, 0, 0 ]);
  }

  return this;
};


// Get the array representing the transform.
//
AffineTransform.prototype.toArray = function () {
  return this.matrix;
};


// Apply the transform to (x,y) point.
// If `isRelative` set, `translate` component of AffineTransform will be skipped
//
AffineTransform.prototype.calc = function (x, y, isRelative) {
  return [ this.matrix[0] * x + this.matrix[2] * y + (isRelative ? 0 : this.matrix[4]),
           this.matrix[1] * x + this.matrix[3] * y + (isRelative ? 0 : this.matrix[5]) ];
};


module.exports = AffineTransform;
