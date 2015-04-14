// SVG Path transformations library
//
// Usage:
//
//    SvgPath('...')
//      .translate(-150, -100)
//      .scale(0.5)
//      .translate(-150, -100)
//      .toFixed(1)
//      .toString()
//

'use strict';


var pathParse      = require('./path_parse');
var transformParse = require('./transform_parse');
var matrix         = require('./matrix');


// Class constructor
//
function SvgPath(path) {
  if (!(this instanceof SvgPath)) { return new SvgPath(path); }

  var pstate = pathParse(path);

  // Array of path segments.
  // Each segment is array [command, param1, param2, ...]
  this.segments = pstate.segments;

  // Error message on parse error.
  this.err      = pstate.err;

  // Transforms stack for lazy evaluation
  this.__stack    = [];
}


SvgPath.prototype.__matrix = function (m) {
  var self = this,
      ma, sx, sy, angle, a, arc2line;

  // Quick leave for empty matrix
  if (!m.queue.length) { return; }

  this.iterate(function (s, index, x, y) {
    var p, result, name, isRelative;

    switch (s[0]) {

      // Process 'assymetric' commands separately
      case 'v':
        p      = m.calc(0, s[1], true);
        result = (p[0] === 0) ? [ 'v', p[1] ] : [ 'l', p[0], p[1] ];
        break;

      case 'V':
        p      = m.calc(x, s[1], false);
        result = (p[0] === m.calc(x, y, false)[0]) ? [ 'V', p[1] ] : [ 'L', p[0], p[1] ];
        break;

      case 'h':
        p      = m.calc(s[1], 0, true);
        result = (p[1] === 0) ? [ 'h', p[0] ] : [ 'l', p[0], p[1] ];
        break;

      case 'H':
        p      = m.calc(s[1], y, false);
        result = (p[1] === m.calc(x, y, false)[1]) ? [ 'H', p[0] ] : [ 'L', p[0], p[1] ];
        break;

      case 'a':
      case 'A':
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]

        // Decompose affine matrix and apply components to arc params
        // http://math.stackexchange.com/questions/78137/decomposition-of-a-nonsquare-affine-matrix

        // Fill cache if empty
        if (!ma) {
          ma = m.toArray();
          sx = Math.sqrt(Math.pow(ma[0], 2) + Math.pow(ma[2], 2));
          arc2line = true;

          if (sx !== 0) {
            sy = (ma[0] * ma[3] - ma[1] * ma[2]) / sx;
            if (sy !== 0) {
              if (ma[0] === 0) {
                angle = ma[1] < 0 ? -90 : 90;
              } else {
                angle = Math.atan(ma[1] / ma[0]) * 180 / Math.PI;
              }
              arc2line = false;
            }
          }
        }

        // If scaleX or scaleY === 0 - replace arc with line
        if (arc2line) {
          result = [ (s[0] === 'a') ? 'l' : 'L', s[6], s[7] ];
          break;
        }

        result = s.slice();

        // Apply scale to rx & ry only
        result[1] = s[1] * sx;
        result[2] = s[2] * sy;

        // Apply rotation angle to x-axis-rotation
        a = s[3] + angle;
        // Normalize value to be in -179.999...180
        // http://stackoverflow.com/a/28316366/1031804
        a += Math.ceil((-a - 180) / 360) * 360;
        result[3] = (a === -180) ? 180 : a;

        // Transform end point as usual (without translation for relative notation)
        p = m.calc(s[6], s[7], s[0] === 'a');
        result[6] = p[0];
        result[7] = p[1];
        break;

      default:
        name       = s[0];
        result     = [ name ];
        isRelative = (name.toLowerCase() === name);

        // Apply transformations to the segment
        for (var i = 1; i < s.length; i += 2) {
          p = m.calc(s[i], s[i + 1], isRelative);
          result.push(p[0], p[1]);
        }
    }

    self.segments[index] = result;
  }, true);
};


// Apply stacked commands
//
SvgPath.prototype.__evaluateStack = function () {
  var m, i;

  if (!this.__stack.length) { return; }

  if (this.__stack.length === 1) {
    this.__matrix(this.__stack[0]);
    this.__stack = [];
    return;
  }

  m = matrix();
  i = this.__stack.length;

  while (--i >= 0) {
    m.matrix(this.__stack[i].toArray());
  }

  this.__matrix(m);
  this.__stack = [];
};


// Convert processed SVG Path back to string
//
SvgPath.prototype.toString = function () {
  var elements = [];

  this.__evaluateStack();

  for (var i = 0; i < this.segments.length; i++) {
    // remove repeating commands names
    if (i > 0 && (this.segments[i][0] === this.segments[i - 1][0])) {
      elements.push(this.segments[i].slice(1));
      continue;
    }
    elements.push(this.segments[i]);
  }

  return [].concat.apply([], elements).join(' ')
    // Optimizations: remove spaces around commands & before `-`
    //
    // We could also remove leading zeros for `0.5`-like values,
    // but their count is too small to spend time for.
    .replace(/ ?([achlmqrstvz]) ?/gi, '$1')
    .replace(/ \-/g, '-')
    // workaround for FontForge SVG importing bug
    .replace(/zm/g, 'z m');
};


// Translate path to (x [, y])
//
SvgPath.prototype.translate = function (x, y) {
  this.__stack.push(matrix().translate(x, y || 0));
  return this;
};


// Scale path to (sx [, sy])
// sy = sx if not defined
//
SvgPath.prototype.scale = function (sx, sy) {
  this.__stack.push(matrix().scale(sx, (!sy && (sy !== 0)) ? sx : sy));
  return this;
};


// Rotate path around point (sx [, sy])
// sy = sx if not defined
//
SvgPath.prototype.rotate = function (angle, rx, ry) {
  this.__stack.push(matrix().rotate(angle, rx || 0, ry || 0));
  return this;
};


// Apply matrix transform (array of 6 elements)
//
SvgPath.prototype.matrix = function (m) {
  this.__stack.push(matrix().matrix(m));
  return this;
};


// Transform path according to "transform" attr of SVG spec
//
SvgPath.prototype.transform = function (transformString) {
  if (!transformString.trim()) {
    return this;
  }
  this.__stack.push(transformParse(transformString));
  return this;
};


// Round coords with given decimal precition.
// 0 by default (to integers)
//
SvgPath.prototype.round = function (d) {
  d = d || 0;

  this.__evaluateStack();

  this.segments.forEach(function (s) {
    // Special processing for ARC:
    // [cmd, rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
    if (s[0].toLowerCase() === 'a') {
      s[1] = +s[1].toFixed(d);
      s[2] = +s[2].toFixed(d);
      s[3] = +s[3].toFixed(d + 2); // better precision for rotation
      s[6] = +s[6].toFixed(d);
      s[7] = +s[7].toFixed(d);
      return;
    }

    s.forEach(function (val, i) {
      if (!i) { return; }
      s[i] = +s[i].toFixed(d);
    });
  });

  return this;
};


// Apply iterator function to all segments. If function returns result,
// current segment will be replaced to array of returned segments.
// If empty array is returned, current regment will be deleted.
//
SvgPath.prototype.iterate = function (iterator, keepLazyStack) {
  var segments = this.segments,
      replacements = {},
      needReplace = false,
      lastX = 0,
      lastY = 0,
      countourStartX = 0,
      countourStartY = 0;
  var i, j, isRelative, newSegments;

  if (!keepLazyStack) {
    this.__evaluateStack();
  }

  segments.forEach(function (s, index) {

    var res = iterator(s, index, lastX, lastY);

    if (Array.isArray(res)) {
      replacements[index] = res;
      needReplace = true;
    }

    // all relative commands except Z
    isRelative = 'achlmqrstv'.indexOf(s[0]) >= 0;
    var nameLC = s[0].toLowerCase();

    // calculate absolute X and Y
    if (nameLC === 'm') {
      lastX = s[1] + (isRelative ? lastX : 0);
      lastY = s[2] + (isRelative ? lastY : 0);
      countourStartX = lastX;
      countourStartY = lastY;
      return;
    }

    if (nameLC === 'h') {
      lastX = s[1] + (isRelative ? lastX : 0);
      return;
    }

    if (nameLC === 'v') {
      lastY = s[1] + (isRelative ? lastY : 0);
      return;
    }

    if (nameLC === 'z') {
      lastX = countourStartX;
      lastY = countourStartY;
      return;
    }

    lastX = s[s.length - 2] + (isRelative ? lastX : 0);
    lastY = s[s.length - 1] + (isRelative ? lastY : 0);
  });

  // Replace segments if iterator return results

  if (!needReplace) { return this; }

  newSegments = [];

  for (i = 0; i < segments.length; i++) {
    if (typeof replacements[i] !== 'undefined') {
      for (j = 0; j < replacements[i].length; j++) {
        newSegments.push(replacements[i][j]);
      }
    } else {
      newSegments.push(segments[i]);
    }
  }

  this.segments = newSegments;

  return this;
};


// Converts segments from relative to absolute
//
SvgPath.prototype.abs = function () {

  this.iterate(function (s, index, x, y) {
    var name = s[0],
        nameUC = name.toUpperCase(),
        i;

    // Skip absolute commands
    if (name === nameUC) { return; }

    s[0] = nameUC;

    // V is the only command, with shifted coords parity
    if (name === 'v') {
      s[1] += y;
      return;
    }

    // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
    // touch x, y only
    if (name === 'a') {
      s[6] += x;
      s[7] += y;
      return;
    }

    for (i = 1; i < s.length; i++) {
      s[i] += i % 2 ? x : y; // odd values are X, even - Y
    }
  }, true);

  return this;
};


// Converts segments from absolute to relative
//
SvgPath.prototype.rel = function () {

  this.iterate(function (s, index, x, y) {
    var name = s[0],
        nameLC = name.toLowerCase(),
        i;

    // Skip relative commands
    if (name === nameLC) { return; }

    s[0] = name.toLowerCase();

    // V is the only command, with shifted coords parity
    if (name === 'V') {
      s[1] -= y;
      return;
    }

    // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
    // touch x, y only
    if (name === 'A') {
      s[6] -= x;
      s[7] -= y;
      return;
    }

    for (i = 1; i < s.length; i++) {
      s[i] -= i % 2 ? x : y; // odd values are X, even - Y
    }
  }, true);

  return this;
};


// Converts smooth curves (with missed control point) to generic curves
//
SvgPath.prototype.unshort = function () {
  var segments = this.segments;
  var prevControlX, prevControlY;
  var curControlX, curControlY;

  // TODO: add lazy evaluation flag when relative commands supported

  this.iterate(function (s, idx, x, y) {
    var name = s[0];

    if (name === 'T') { // qubic curve
      s[0] = 'Q';
      prevControlX = segments[idx - 1][0] === 'Q' ? segments[idx - 1][1] : x;
      curControlX = 2 * (x || 0) - (prevControlX || 0);
      prevControlY = segments[idx - 1][0] === 'Q' ? segments[idx - 1][2] : y;
      curControlY = 2 * (y || 0) - (prevControlY || 0);
      segments[idx] = [
        s[0],
        curControlX, curControlY,
        s[1], s[2]
      ];
    } else if (name === 'S') { // quadratic curve

      s[0] = 'C';
      prevControlX = segments[idx - 1][0] === 'C' ? segments[idx - 1][3] : x;
      curControlX = 2 * (x || 0) - (prevControlX || 0);
      prevControlY = segments[idx - 1][0] === 'C' ? segments[idx - 1][4] : y;
      curControlY = 2 * (y || 0) - (prevControlY || 0);
      segments[idx] = [
        s[0],
        curControlX, curControlY,
        s[1], s[2], s[3], s[4]
      ];
    }
  });

  return this;
};


module.exports = SvgPath;
