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

  // Array of path segments.
  // Each segment is array [command, param1, param2, ...]
  var pstate = pathParse(path);

  this.segments = pstate.segments;
  this.err = pstate.err;
}


SvgPath.prototype.__matrix = function (m) {
  var self = this;

  this.iterate(function (segment, index, x, y) {
    var prev, point, result, name, isRelative;

    switch (segment[0]) {

      // Process 'assymetric' commands separately
      case 'v':
        point  = m.calc(0, segment[1], true);
        result = (point[0] === 0) ? [ 'v', point[1] ] : [ 'l', point[0], point[1] ];
        break;

      case 'V':
        prev   = m.calc(x, y, false);
        point  = m.calc(x, segment[1], false);
        result = (point[0] === prev[0]) ? [ 'V', point[1] ] : [ 'L', point[0], point[1] ];
        break;

      case 'h':
        point  = m.calc(segment[1], 0, true);
        result = (point[1] === 0) ? [ 'h', point[0] ] : [ 'l', point[0], point[1] ];
        break;

      case 'H':
        prev   = m.calc(x, y, false);
        point = m.calc(segment[1], y, false);
        result = (point[1] === prev[1]) ? [ 'H', point[0] ] : [ 'L', point[0], point[1] ];
        break;

      // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]

      case 'a':
        result = segment.slice();
        point  = m.calc(segment[1], segment[2], true);
        result[1] = point[0];
        result[2] = point[1];
        point  = m.calc(segment[6], segment[7], true);
        result[6] = point[0];
        result[7] = point[1];
        break;

      case 'A':
        result = segment.slice();
        point  = m.calc(segment[1], segment[2], true);
        result[1] = point[0];
        result[2] = point[1];
        point  = m.calc(segment[6], segment[7], false);
        result[6] = point[0];
        result[7] = point[1];
        break;

      default:
        name       = segment[0];
        result     = [ name ];
        isRelative = (name.toLowerCase() === name);

        // Apply transformations to the segment
        for (var i = 1; i < segment.length; i += 2) {
          point = m.calc(segment[i], segment[i + 1], isRelative);
          result.push(point[0], point[1]);
        }
    }

    self.segments[index] = result;
  });
};


// Convert processed SVG Path back to string
//
SvgPath.prototype.toString = function () {
  var elements = [];

  for (var s = 0; s < this.segments.length; s++) {
    // remove repeating commands names
    if (s > 0 && (this.segments[s][0] === this.segments[s - 1][0])) {
      elements.push(this.segments[s].slice(1));
      continue;
    }
    elements.push(this.segments[s]);
  }

  return [].concat.apply([], elements).join(' ')
    // Optimizations: remove spaces around commands & before `-`
    //
    // We could also remove leading zeros for `0.5`-like values,
    // but their count is too small to spend time for.
    .replace(/ ?([achlmqrstvxz]) ?/gi, '$1')
    .replace(/ \-/g, '-')
    // workaround for FontForge SVG importing bug
    .replace(/zm/g, 'z m');
};


// Translate coords to (x [, y])
//
SvgPath.prototype.translate = function (x, y) {
  y = y || 0;

  this.__matrix(matrix().translate(x, y));

  return this;
};


// Scale coords to (sx [, sy])
// sy = sx if not defined
//
SvgPath.prototype.scale = function (sx, sy) {
  sy = (!sy && (sy !== 0)) ? sx : sy;

  this.__matrix(matrix().scale(sx, sy));

  return this;
};


// Transform coords according to "transform" attr of SVG spec
//
SvgPath.prototype.transform = function (transformString) {
  if (!transformString.trim()) {
    return this;
  }

  this.__matrix(transformParse(transformString));

  return this;
};


// Round coords with given decimal precition.
// 0 by default (to integers)
//
SvgPath.prototype.round = function (d) {
  d = d || 0;

  this.segments.forEach(function (segment) {

    // Special processing for ARC:
    // [cmd, rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
    // don't touch flags and rotation
    if (segment[0].toLowerCase() === 'a') {
      segment[1] = +segment[1].toFixed(d);
      segment[2] = +segment[2].toFixed(d);
      segment[6] = +segment[6].toFixed(d);
      segment[7] = +segment[7].toFixed(d);
      return;
    }

    segment.forEach(function (val, i) {
      if (!i) { return; }
      segment[i] = +segment[i].toFixed(d);
    });

  });

  return this;
};


// Apply iterator function to all segments. If function returns result,
// current segment will be replaced to array of returned segments.
// If empty array is returned, current regment will be deleted.
//
SvgPath.prototype.iterate = function (iterator) {
  var segments = this.segments,
      replaceQueue = [],
      lastX = 0,
      lastY = 0,
      countourStartX = 0,
      countourStartY = 0;
  var index, isRelative;

  segments.forEach(function (segment, index) {

    var res = iterator(segment, index, lastX, lastY);
    if (Array.isArray(res)) {
      replaceQueue.push({ index:index, segments:res });
    }

    // all relative commands except Z
    isRelative = 'achlmqrstv'.indexOf(segment[0]) >= 0;
    var name = segment[0].toLowerCase();

    // calculate absolute X and Y
    if (name === 'm') {
      lastX = segment[1] + (isRelative ? lastX : 0);
      lastY = segment[2] + (isRelative ? lastY : 0);
      countourStartX = lastX;
      countourStartY = lastY;
      return;
    }

    if (name === 'h') {
      lastX = segment[1] + (isRelative ? lastX : 0);
      return;
    }

    if (name === 'v') {
      lastY = segment[1] + (isRelative ? lastY : 0);
      return;
    }

    if (name === 'z') {
      lastX = countourStartX;
      lastY = countourStartY;
      return;
    }

    lastX = segment[segment.length - 2] + (isRelative ? lastX : 0);
    lastY = segment[segment.length - 1] + (isRelative ? lastY : 0);
  });

  // Replace segments if iterator return results
  var len = replaceQueue.length;
  for (index = len - 1; index >= 0; index--) {
    segments.splice(replaceQueue[index].index, 1);

    // FIXME: Replace cycle with `apply`
    var newSegLen = replaceQueue[index].segments.length;
    for (var newSegIndex = newSegLen - 1; newSegIndex >= 0; newSegIndex--) {
      segments.splice(replaceQueue[index].index, 0, replaceQueue[index].segments[newSegIndex]);
    }
  }

  return this;
};


// Converts segments from relative to absolute
//
SvgPath.prototype.abs = function () {

  this.iterate(function (segment, index, x, y) {
    var name = segment[0];

    // Skip absolute commands
    if ('ACHLMRQSTVZ'.indexOf(name) >= 0) { return; }

    // absolute commands has uppercase names
    segment[0] = name.toUpperCase();

    // V is the only command, with shifted coords parity
    if (name === 'v') {
      segment[1] += y;
      return;
    }

    // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
    // touch x, y only
    if (name === 'a') {
      segment[6] += x;
      segment[7] += y;
      return;
    }

    segment.forEach(function (val, i) {
      if (!i) { return; } // skip command
      segment[i] = i % 2 ? val + x : val + y; // odd values are X, even - Y
    });

  });

  return this;
};


// Converts segments from absolute to relative
//
SvgPath.prototype.rel = function () {

  this.iterate(function (segment, index, x, y) {
    var name = segment[0];

    // Skip relative commands
    if ('ACHLMRQSTVZ'.indexOf(name) === -1) { return; }

    // relative commands has lowercase names
    segment[0] = name.toLowerCase();

    // V is the only command, with shifted coords parity
    if (name === 'V') {
      segment[1] -= y;
      return;
    }

    // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
    // touch x, y only
    if (name === 'A') {
      segment[6] -= x;
      segment[7] -= y;
      return;
    }

    segment.forEach(function (val, i) {
      if (!i) { return; } // skip command
      segment[i] = i % 2 ? val - x : val - y; // odd values are X, even - Y
    });

  });

  return this;
};


// Converts smooth curves (with missed control point) to generic curves
//
SvgPath.prototype.unshort = function () {
  var self = this;
  var prevControlX, prevControlY;
  var curControlX, curControlY;

  this.iterate(function (segment, index, x, y) {
    var name = segment[0];

    if (name === 'T') { // qubic curve
      segment[0] = 'Q';
      prevControlX = self.segments[index - 1][0] === 'Q' ? self.segments[index - 1][1] : x;
      curControlX = 2 * (x || 0) - (prevControlX || 0);
      prevControlY = self.segments[index - 1][0] === 'Q' ? self.segments[index - 1][2] : y;
      curControlY = 2 * (y || 0) - (prevControlY || 0);
      segment.splice(1, 0, curControlX, curControlY);
    } else if (name === 'S') { // quadratic curve

      segment[0] = 'C';
      prevControlX = self.segments[index - 1][0] === 'C' ? self.segments[index - 1][3] : x;
      curControlX = 2 * (x || 0) - (prevControlX || 0);
      prevControlY = self.segments[index - 1][0] === 'C' ? self.segments[index - 1][4] : y;
      curControlY = 2 * (y || 0) - (prevControlY || 0);
      segment.splice(1, 0, curControlX, curControlY);
    }
  });

  return this;
};


module.exports = SvgPath;
