'use strict';

function Matrix() {

  this.transformations = [];

  return this;
}

Matrix.prototype.calc = function(x, y, isRelative) {
  var newXY = [x,y];

  this.transformations.forEach(function(trans) {
    if( isRelative && trans.operation === 'translate'){
      return;
    }
    if(isRelative){
      newXY = [
        newXY[0] * trans.matrix[0] + newXY[1] * trans.matrix[2],
        newXY[0] * trans.matrix[1] + newXY[1] * trans.matrix[3]
      ];
    } else {
      newXY = [
        newXY[0] * trans.matrix[0] + newXY[1] * trans.matrix[2] + trans.matrix[4],
        newXY[0] * trans.matrix[1] + newXY[1] * trans.matrix[3] + trans.matrix[5]
      ];
    }
  });
  return newXY;
};

// params = [a, b, c, d, e, f]
Matrix.prototype.matrix = function(params) {
  this.transformations.unshift({
    'operation' : 'matrix',
    'matrix' : params
  });
};

// params = [angle <, x, y>]
Matrix.prototype.rotate = function(params) {

  var alpha = params[0] * Math.PI / 180;
  var cosa = Math.cos(alpha);
  var sina = Math.sin(alpha);

  if (params.length === 3) {
    // Rotation about point ( params[1], params[2])

    this.translate([ params[1], params[2]]);

    this.transformations.unshift({
      'operation' : 'rotate',
      'matrix' : [ cosa, sina, -sina, cosa, 0, 0 ],
    });
    this.translate([ -params[1], -params[2] ]);

  } else {
    // Rotation about point ( 0, 0)

    this.transformations.unshift({
      'operation' : 'rotate',
      'matrix' : [ cosa, sina, -sina, cosa, 0, 0 ]
    });
  }
};

// params = [x <, y>]
Matrix.prototype.scale = function(params) {
  this.transformations.unshift({
    'operation' : 'scale',
    'matrix' : [ params[0] , 0, 0, (params.length === 2 ? params[1] : params[0]), 0, 0 ],
  });
};

// params = [angle]
Matrix.prototype.skewX = function(params) {
  this.transformations.unshift({
    'operation' : 'skewX',
    'matrix' : [ 1, 0, Math.tan(params[0] * Math.PI / 180), 1, 0, 0 ],
  });
};

// params = [angle]
Matrix.prototype.skewY = function(params) {
  this.transformations.unshift({
    'operation' : 'skewY',
    'matrix' : [ 1, Math.tan(params[0] * Math.PI / 180), 0, 1, 0, 0 ],
  });
};

// params = [x <, y>]
Matrix.prototype.translate = function(params) {
  this.transformations.unshift({
    'operation' : 'translate',
    'matrix' : [ 1, 0, 0, 1, params[0], (params.length === 2 ? params[1] : 0) ],
  });
};

module.exports = Matrix;
