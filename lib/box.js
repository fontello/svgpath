'use strict';

// precision for consider cubic polynom as quadratic one
var epsilon = 0.00000001;

// New box : empty or parsed from string like '-10 10 300 400'
//
function Box(s) {
  if (!(this instanceof Box)) { return new Box(s); }

  // minX, minY, maxX, maxY : are not defined yet
  // but empty box has 0 x 0 size
  this.width = this.height = 0;

  // parse the string parameter
  if (s && s.constructor === String) {
    var a = s.trim().split(/\s+/).map(parseFloat);

    this.addX(a[0]).addX(a[0] + a[2]).addY(a[1]).addY(a[1] + a[3]);
  }

  return this;
}

// check if box is not defined yet
//
Box.prototype.isUndefined = function () {
  return (typeof this.minX === 'undefined') || (typeof this.minY === 'undefined');
};

// add new X coordinate
//
Box.prototype.addX = function (x) {
  if (typeof this.minX === 'undefined') {
    this.minX = this.maxX = x;
    this.width = 0;
  } else {
    this.minX = Math.min(this.minX, x);
    this.maxX = Math.max(this.maxX, x);
    this.width = this.maxX - this.minX;
  }

  return this;
};

// add new Y coordinate
//
Box.prototype.addY = function (y) {
  if (typeof this.minY === 'undefined') {
    this.minY = this.maxY = y;
    this.height = 0;
  } else {
    this.minY = Math.min(this.minY, y);
    this.maxY = Math.max(this.maxY, y);
    this.height = this.maxY - this.minY;
  }

  return this;
};

// add new point
//
Box.prototype.addPoint = function (x, y) {
  return this.addX(x).addY(y);
};


// ------------------------------
// return [min,max]
// of A[0] * (1-t) * (1-t) + A[1] * 2 * (1-t) * t + A[2] * t * t
// for t in [0,1]
// ------------------------------
function minmaxQ(A) {
  var min = Math.min(A[0], A[2]),
      max = Math.max(A[0], A[2]);

  if (A[1] > A[0] ? A[2] >= A[1] : A[2] <= A[1]) {
    // if no extremum in ]0,1[
    return [ min, max ];
  }

  // check if the extremum E is min or max
  var E = (A[0] * A[2] - A[1] * A[1]) / (A[0] - 2 * A[1] + A[2]);
  return E < min ? [ E, max ] : [ min, E ];
}

// add new quadratic curve to X coordinate
//
Box.prototype.addXQ = function (A) {
  var minmax = minmaxQ(A);

  return this.addX(minmax[0]).addX(minmax[1]);
};

// add new quadratic curve to Y coordinate
//
Box.prototype.addYQ = function (A) {
  var minmax = minmaxQ(A);

  return this.addY(minmax[0]).addY(minmax[1]);
};


// ------------------------------
// return [min,max]
// of A[0] * (1-t) * (1-t) * (1-t) + A[1] * 3 * (1-t) * (1-t) * t + A[2] * 3 * (1-t) * t * t + A[3] * t * t * t
// for t in [0,1]
// ------------------------------
function minmaxC(A) {
  // if the polynomial is (almost) quadratic and not cubic
  var K = A[0] - 3 * A[1] + 3 * A[2] - A[3];
  if (Math.abs(K) < epsilon) {
    return minmaxQ([ A[0], -0.5 * A[0] + 1.5 * A[1], A[0] - 3 * A[1] + 3 * A[2] ]);
  }


  // the reduced discriminant of the derivative
  var T = -A[0] * A[2] + A[0] * A[3] - A[1] * A[2] - A[1] * A[3] + A[1] * A[1] + A[2] * A[2];

  // if the polynomial is monotone in [0,1]
  if (T <= 0) {
    return [ Math.min(A[0], A[3]), Math.max(A[0], A[3]) ];
  }
  var S = Math.sqrt(T);

  // potential extrema
  var max = Math.max(A[0], A[3]),
      min = Math.min(A[0], A[3]);

  var L = A[0] - 2 * A[1] + A[2];
  // check local extrema
  for (var R = (L + S) / K, i = 1; i <= 2; R = (L - S) / K, i++) {
    if (R > 0 && R < 1) {
      // if the extrema is for R in [0,1]
      var Q = A[0] * (1 - R) * (1 - R) * (1 - R) +
              A[1] * 3 * (1 - R) * (1 - R) * R +
              A[2] * 3 * (1 - R) * R * R +
              A[3] * R * R * R;
      if (Q < min) { min = Q; }
      if (Q > max) { max = Q; }
    }
  }

  return [ min, max ];
}

// add new cubic curve to X coordinate
//
Box.prototype.addXC = function (A) {
  var minmax = minmaxC(A);

  return this.addX(minmax[0]).addX(minmax[1]);
};

// add new cubic curve to Y coordinate
//
Box.prototype.addYC = function (A) {
  var minmax = minmaxC(A);

  return this.addY(minmax[0]).addY(minmax[1]);
};

// return a string like '-10 10 300 400'
//
Box.prototype.toViewBoxString = function (pr) {
  // if empty box
  if (this.isUndefined()) {
    return '0 0 0 0';
  }

  // else
  return  ((typeof pr === 'undefined') ?
              [ this.minX, this.minY, this.width, this.height ]
            :
              [
                this.minX.toFixed(pr), this.minY.toFixed(pr),
                this.width.toFixed(pr), this.height.toFixed(pr)
              ]
          ).join(' ');
};

// return the transform that translate and scale to fit in a box
// controlled by the following parameters :
// - type:
//  - fit(=none) : scale the box (aspect ratio is not preserved) to fit in the box
//  - meet (the default) : scale the box (aspect ratio is preserved) as much as possible
//                         to cover the destination box
//  - slice : scale the box (aspect ratio is preserved) as less as possible to cover the destination box
//  - move : translate only (no scale) the box according to x???y??? parameter
// - position x(Min|Mid|Max)Y(Min|Mid|Max).
//  example : matrixToBox(src, '100 0 200 300 meet xMidYMin')
//
Box.prototype.matrixToBox = function (parameters) {
  var dst = new Box(parameters.match(/(-|\d|\.|\s)+/)[0]);

  // get the action (default is 'meet')
  var action = ((parameters + 'meet').match(/(fit|none|meet|slice|move)/))[0];

  if (action === 'none') { // for compatibility with 'preserveAspectRatio'
    action = 'fit';
  }

  // set the scale factors based on the action
  var rx, ry;
  switch (action) {
    case 'fit':
      rx = this.width ? dst.width / this.width : 1;
      ry = this.height ? dst.height / this.height : 1;
      break;
    case 'slice' :
      if (this.width !== 0 && this.height !== 0) {
        rx = ry = Math.max(dst.width  / this.width, dst.height / this.height);
        break;
      }
      // else falls through
    case 'meet' :
      rx = ry = (this.width === 0 && this.height === 0) ? 1 :
                Math.min(dst.width / this.width, dst.height / this.height);
      break;
    case 'move':
      rx = ry = 1;
      break;
  }

  // get the position from string like 'xMidYMax'
  var position = {};
  position.X = ((parameters + 'xMid').match(/x(Min|Mid|Max)/i))[1].toLowerCase();
  position.Y = ((parameters + 'YMid').match(/Y(Min|Mid|Max)/i))[1].toLowerCase();

  //  variable that helps to loop over the two boxes
  var origin = {},
      box = {};
  box.src = this;
  box.dst = dst;

  // set the 'origin' of the two boxes based on the position parameters
  for (var c = 'X', i = 1; i <= 2; c = 'Y', i++) {
    for (var b = 'src', j = 1; j <= 2; b = 'dst', j++) {
      switch (position[c]) {
        case 'min':
          origin[b + c] = box[b]['min' + c];
          break;
        case 'mid':
          origin[b + c] = (box[b]['min' + c] + box[b]['max' + c]) / 2;
          break;
        case 'max':
          origin[b + c] = box[b]['max' + c];
          break;
      }
    }
  }

  // return the matrix that is equivalent to
  // .translate(-box.src.originX,-box.src.originY)
  // .scale(rx,ry)
  // .translate(box.dst.originX,box.dst.originY);
  return [ rx, 0, 0, ry, origin.dstX - rx * origin.srcX, origin.dstY - ry * origin.srcY ];
};

module.exports = Box;
