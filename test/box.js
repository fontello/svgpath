'use strict';


var assert = require('assert');
var box = require('../lib/box');

var b, m;

describe('Box', function () {

  it('default box is undefined with size 0 x 0', function () {
    b = box();

    assert(b.isUndefined());
    assert.equal(b.width, 0);
    assert.equal(b.height, 0);
  });

  it('parse from string', function () {
    b = box('-1 2 4 5');

    assert.equal(b.minX, -1);
    assert.equal(b.maxX, 3);
    assert.equal(b.width, 4);
    assert.equal(b.minY, 2);
    assert.equal(b.maxY, 7);
    assert.equal(b.height, 5);
  });

  it('add a point', function () {
    b = box().addPoint(1, 1);

    assert.equal(b.minX, 1);
    assert.equal(b.maxX, 1);
    assert.equal(b.width, 0);
    assert.equal(b.minY, 1);
    assert.equal(b.maxY, 1);
    assert.equal(b.height, 0);

    b.addX(2);

    assert.equal(b.minX, 1);
    assert.equal(b.maxX, 2);
    assert.equal(b.width, 1);
    assert.equal(b.minY, 1);
    assert.equal(b.maxY, 1);
    assert.equal(b.height, 0);

    b.addY(3);

    assert.equal(b.minX, 1);
    assert.equal(b.maxX, 2);
    assert.equal(b.width, 1);
    assert.equal(b.minY, 1);
    assert.equal(b.maxY, 3);
    assert.equal(b.height, 2);

    b.addPoint(4, -5);

    assert.equal(b.minX, 1);
    assert.equal(b.maxX, 4);
    assert.equal(b.width, 3);
    assert.equal(b.minY, -5);
    assert.equal(b.maxY, 3);
    assert.equal(b.height, 8);
  });

  it('add quadratic curve', function () {
    b = box().addXQ([ 0, 3, 1 ]);

    assert.equal(b.minX, 0);
    assert.equal(b.maxX, 1.8);
    assert.equal(b.width, 1.8);

    b = box().addYQ([ 0, -2, 1 ]);

    assert.equal(b.minY, -0.8);
    assert.equal(b.maxY, 1);
    assert.equal(b.height, 1.8);
  });

  it('add cubic curve', function () {
    b = box().addXC([ 0, -70, 210, 100 ]);

    assert.equal(Math.round(b.minX), -11);
    assert.equal(Math.round(b.maxX), 126);
    assert.equal(Math.round(b.width), 137);

    b = box().addYC([ 0, 1, 2, 3 ]);

    assert.equal(b.minY, 0);
    assert.equal(b.maxY, 3);
    assert.equal(b.height, 3);
  });

  it('view box', function () {
    b = box().addXC([ 0, -70, 210, 100 ]).addYC([ 0, -30, 70, 40 ]);

    assert.equal(b.toViewBoxString(0), '-11 -6 137 51');

    b = box('-10 20 30 50');

    assert.equal(b.minX, -10);
    assert.equal(b.maxX, 20);
    assert.equal(b.width, 30);
    assert.equal(b.minY, 20);
    assert.equal(b.maxY, 70);
    assert.equal(b.height, 50);
  });

  it('matrix to put in a box', function () {
    b = box('-10 0 40 50');

    m = b.matrixToBox('0 0 100 200'); // default is meet xMidYMid
    assert.deepEqual(m, [ 2.5, 0, 0, 2.5, 25, 37.5 ]);

    m = b.matrixToBox('0 0 100 200 slice xMinYMax');
    assert.deepEqual(m, [ 4, 0, 0, 4, 40, 0 ]);

    m = b.matrixToBox('0 0 100 200 fit');
    assert.deepEqual(m, [ 2.5, 0, 0, 4, 25, 0 ]);

    m = b.matrixToBox('0 0 100 200 move xMinYmid');
    assert.deepEqual(m, [ 1, 0, 0, 1, 10, 75 ]);
  });

});
