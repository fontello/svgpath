'use strict';


var Matrix = require('./matrix');

var commandsParamsCount = {
  matrix:    [ 6 ],
  scale:     [ 1, 2 ],
  rotate:    [ 1, 3 ],
  translate: [ 1, 2 ],
  skewX:     [ 1 ],
  skewY:     [ 1 ]
};

var reTransformCommandSplit = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/;
var reTransformDataSplit = /[\s,]+/;


module.exports = function transformParse(transformString) {
  var matrix = new Matrix();
  var current;

  // Split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate',  '-45', '']
  transformString.split(reTransformCommandSplit).forEach(function (item) {

    if (item) {
      // if item is a translate function
      if (commandsParamsCount[item]) {

        // then change current context
        current = {
          name : item
        };

        // else if item is data
      } else {

        // then split it into [10, 50] and collect as context.data
        current.data = item.split(reTransformDataSplit).map(function (i) {
          return +i;
        });

        // If count of data is not correct then remove current context
        if (commandsParamsCount[current.name].indexOf(current.data.length) !== -1) {
          matrix[current.name](current.data);
        }
      }
    }
  });

  return matrix;
};
