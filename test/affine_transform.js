'use strict';


var assert = require('assert');
var affineTransform = require('../lib/affine_transform');

var at;

describe('AffineTransform', function () {

  it('constructor', function () {
    at = affineTransform();
    assert.deepEqual(at.toArray(), [ 1, 0, 0, 1, 0, 0 ]);

    at = affineTransform([ 1, 2, 3, 4 ]);
    assert.deepEqual(at.toArray(), [ 1, 2, 3, 4, 0, 0 ]);

    at = affineTransform('1 2 3 4');
    assert.deepEqual(at.toArray(), [ 1, 2, 3, 4, 0, 0 ]);

    at = affineTransform([ 1, 2, 3, 4, 5, 7 ]);
    assert.deepEqual(at.toArray(), [ 1, 2, 3, 4, 5, 7 ]);

    at = affineTransform('1 2 3 4 5 7');
    assert.deepEqual(at.toArray(), [ 1, 2, 3, 4, 5, 7 ]);
  });

  it('trivial transform', function () {
    at = affineTransform();

    at = affineTransform([ 1, 2, 3, 4 ]);
    assert(!at.isIdentity());

    at = affineTransform([ 1, 2, 3, 4 ]).reset();
    assert(at.isIdentity());
  });

  it('compose', function () {
    at = affineTransform([ 1, 2, 3, 4, 1, 2 ]).compose([ 1, -2, 3, -4, -1, -2 ]);
    assert.deepEqual(at.toArray(), [ 7, -10, 15, -22, 6, -12 ]);
  });

  it('standard transforms', function () {
    at = affineTransform([ 1, 2, 3, 4, 1, 2 ]).translate(1, 2);
    assert.deepEqual(at.toArray(), [ 1, 2, 3, 4, 2, 4 ]);

    at = affineTransform([ 1, 2, 3, 4, 1, 2 ]).scale(1.5, 2);
    assert.deepEqual(at.toArray(), [ 1.5, 4, 4.5, 8, 1.5, 4 ]);

    at = affineTransform([ 100, 200, 300, 400, 100, 200 ]).rotate(42, 5, -4);
    assert.deepEqual(at.toArray().map(Math.round), [ -60, 216, -45, 498, -61, 211 ]);

    at = affineTransform([ 100, 200, 300, 400, 100, 200 ]).skewX(42);
    assert.deepEqual(at.toArray().map(Math.round), [ 280, 200, 660, 400, 280, 200 ]);

    at = affineTransform([ 100, 200, 300, 400, 100, 200 ]).skewY(42);
    assert.deepEqual(at.toArray().map(Math.round), [ 100, 290, 300, 670, 100, 290 ]);
  });

});
