/*global describe, it*/

'use strict';


var assert  = require('assert');
var fs      = require('fs');
var path    = require('path');

var svgpath = require('../');


describe('Path parse', function () {

  it('big batch', function () {
    var batch = fs.readFileSync(path.join(__dirname, '/fixtures/big.txt'), 'utf8').split(/[\r\n]/);

    for (var i = 0; i < batch.length; i++) {
      if (!batch[i]) { continue; }
      assert.equal(batch[i], svgpath(batch[i]).toString());
    }
  });


  it('empty string', function () {
    assert.equal(svgpath('').toString(), '');
  });


  it('line terminators', function () {
    assert.equal(svgpath('M0\r 0\n\u1680l2-3\nz').toString(), 'M0 0l2-3z');
  });


  it('params formats', function () {
    assert.equal(svgpath('M 0.0 0.0').toString(),  'M0 0');
    assert.equal(svgpath('M 1e2 0').toString(),    'M100 0');
    assert.equal(svgpath('M 1e+2 0').toString(),   'M100 0');
    assert.equal(svgpath('M +1e+2 0').toString(),  'M100 0');
    assert.equal(svgpath('M 1e-2 0').toString(),   'M0.01 0');
    assert.equal(svgpath('M 0.1e-2 0').toString(), 'M0.001 0');
    assert.equal(svgpath('M .1e-2 0').toString(),  'M0.001 0');
  });

  it('repeated', function () {
    assert.equal(svgpath('M 0 0 100 100').toString(),  'M0 0L100 100');
    assert.equal(svgpath('m 0 0 100 100').toString(),  'M0 0l100 100');
    assert.equal(svgpath('M 0 0 R 1 1 2 2').toString(),  'M0 0R1 1 2 2');
    assert.equal(svgpath('M 0 0 r 1 1 2 2').toString(),  'M0 0r1 1 2 2');
  });

  it('errors', function () {
    assert.equal(svgpath('0').err, 'SvgPath: bad command 0 (at pos 0)');
    assert.equal(svgpath('U').err, 'SvgPath: bad command U (at pos 0)');
    assert.equal(svgpath('z').err, 'SvgPath: string should start with `M` or `m`');
    assert.equal(svgpath('M+').err, 'SvgPath: param should start with 0..9 or `.` (at pos 2)');
    assert.equal(svgpath('M00').err, 'SvgPath: numbers started with `0` such as `09` are ilegal (at pos 1)');
    assert.equal(svgpath('M0e').err, 'SvgPath: invalid float exponent (at pos 3)');
  });
});
