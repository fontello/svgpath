'use strict';


var affineTransform = require('./affine_transform');

var numeric_params = {
  matrix: true,
  scale: true,
  rotate: true,
  translate: true,
  skewX: true,
  skewY: true
};

var CMD_SPLIT_RE    = /\s*((?:matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(?:.+?)\s*\))[\s,]*/;
var PARAMS_SPLIT_RE = /[\s(),]+/;


module.exports = function transformParse(transformString) {
  var theTransform = affineTransform();
  var transforms, cmd, params;

  // Split value into ['', 'translate(10 50)', '', 'scale(2)', '', 'rotate(-45)', '']
  // then eliminate empty strings with .filter(Boolean)
  transforms = transformString.split(CMD_SPLIT_RE).filter(Boolean);
  for (var i = transforms.length - 1; i >= 0; i--) {
    // params will be something like ["scale","1","2"]
    params = transforms[i].split(PARAMS_SPLIT_RE).filter(Boolean);

    // Skip bad commands (if any)
    if (params.length < 2) { continue; }

    // separate the command from the parameters
    cmd = params.shift();
    // if all parameters should be numeric, parse them
    if (numeric_params[cmd]) {
      params = params.map(parseFloat);
    }

    // If params count is not correct - ignore command
    switch (cmd) {
      case 'matrix':
        if (params.length === 6 || params.length === 4) {
          theTransform.compose(params);
        }
        break;

      case 'scale':
        if (params.length === 1) {
          theTransform.scale(params[0], params[0]);
        } else if (params.length === 2) {
          theTransform.scale(params[0], params[1]);
        }
        break;

      case 'rotate':
        if (params.length === 1) {
          theTransform.rotate(params[0], 0, 0);
        } else if (params.length === 3) {
          theTransform.rotate(params[0], params[1], params[2]);
        }
        break;

      case 'translate':
        if (params.length === 1) {
          theTransform.translate(params[0], 0);
        } else if (params.length === 2) {
          theTransform.translate(params[0], params[1]);
        }
        break;

      case 'skewX':
        if (params.length === 1) {
          theTransform.skewX(params[0]);
        }
        break;

      case 'skewY':
        if (params.length === 1) {
          theTransform.skewY(params[0]);
        }
        break;
    } // end switch
  } // end for

  return theTransform;
};
