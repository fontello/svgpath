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
      assert(batch[i], new SvgPath(batch[i]).toString());
    }
  });


  it.skip('empty string', function () {
    console.log(new SvgPath('').segments);
    assert('', new SvgPath('').toString());
  });

});