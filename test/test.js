/*global describe, it*/

'use strict';


var assert  = require('assert');
var fs      = require('fs');

var SvgPath = require('../');


describe('Parse', function () {

  it('big batch', function () {
    var batch = fs.readFileSync(__dirname +'/fixtures/big.txt', 'utf8').split(/[\r\n]/);

    for (var i=0; i<batch.length; i++) {
      if (!batch[i]) { continue; }
      assert.equal(batch[i], new SvgPath(batch[i]).toString());
    }
  });


  it('empty string', function () {
    assert.equal('', new SvgPath('').toString());
  });

});