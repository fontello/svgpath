/*global describe, it*/

'use strict';


var assert  = require('assert');
var fs      = require('fs');
var path    = require('path');

var SvgPath = require('../');


describe('Path parse', function () {

  it('big batch', function () {
    var batch = fs.readFileSync(path.join(__dirname, '/fixtures/big.txt'), 'utf8').split(/[\r\n]/);

    for (var i = 0; i < batch.length; i++) {
      if (!batch[i]) { continue; }
      assert.equal(batch[i], new SvgPath(batch[i]).toString());
    }
  });


  it('empty string', function () {
    assert.equal('', new SvgPath('').toString());
  });


  it('line terminators', function () {
    assert.equal('M0 0l2-3z', new SvgPath('M0\r 0\nl2-3\nz').toString());
  });


  it('params formats', function () {
    assert.equal('M0 0', new SvgPath('M 0.0 0.0').toString());
    assert.equal('M100 0', new SvgPath('M 1e+2 0').toString());
    assert.equal('M100 0', new SvgPath('M +1e+2 0').toString());
    assert.equal('M0.01 0', new SvgPath('M 1e-2 0').toString());
    assert.equal('M0.001 0', new SvgPath('M 0.1e-2 0').toString());
    assert.equal('M0.001 0', new SvgPath('M .1e-2 0').toString());
  });
});
