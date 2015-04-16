'use strict';


var assert = require('assert');
var matrix = require('../lib/matrix');

var m;

describe('Matrix', function () {

  it('ignore empty actions', function () {
    m = matrix();

    m.matrix([ 1, 0, 0, 1, 0, 0 ]);
    assert.equal(m.queue.length, 0);

    m.translate(0, 0);
    assert.equal(m.queue.length, 0);

    m.scale(1, 1);
    assert.equal(m.queue.length, 0);

    m.rotate(0);
    assert.equal(m.queue.length, 0);

    m.skewX(0);
    assert.equal(m.queue.length, 0);

    m.skewY(0);
    assert.equal(m.queue.length, 0);
  });

  it('do nothing on empty queue', function () {
    assert.deepEqual(matrix().calc(10, 11, false), [ 10, 11 ]);
    assert.deepEqual(matrix().toArray(), [ 1, 0, 0, 1, 0, 0 ]);
  });

  it('compose', function () {
    m = matrix()
          .translate(10, 10)
          .translate(-10, -10)
          .rotate(180, 10, 10)
          .rotate(180, 10, 10)
          .toArray();

    // Need to round errors prior to compare
    assert.equal(+m[0].toFixed(2), 1);
    assert.equal(+m[1].toFixed(2), 0);
    assert.equal(+m[2].toFixed(2), 0);
    assert.equal(+m[3].toFixed(2), 1);
    assert.equal(+m[4].toFixed(2), 0);
    assert.equal(+m[5].toFixed(2), 0);
  });

  it('cache', function () {
    m = matrix()
          .translate(10, 20)
          .scale(2, 3);

    assert.strictEqual(m.cache, null);
    assert.deepEqual(m.toArray(), [ 2, 0, 0, 3, 10, 20 ]);
    assert.deepEqual(m.cache, [ 2, 0, 0, 3, 10, 20 ]);
    m.cache = [ 1, 2, 3, 4, 5, 6 ];
    assert.deepEqual(m.toArray(), [ 1, 2, 3, 4, 5, 6 ]);
  });

});
