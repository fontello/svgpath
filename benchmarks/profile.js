'use strict';

var fs      = require('fs');
var SvgPath = require('../');

var data = fs.readFileSync(__dirname +'/samples/big.txt', 'utf8').split(/[\r\n]/);


var p = [];

data.forEach(function(path) {
  p.push(new SvgPath(path));
});
