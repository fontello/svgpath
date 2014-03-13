'use strict';

var SvgPath = require('../../../');

exports.run = function(data) {
  var p = [];
  data.forEach(function(path) {
    p.push(new SvgPath(path));
  });
  return p;
};
