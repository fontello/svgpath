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


// Class constructor
//
function SvgPath(pathString) {
  if (!(this instanceof SvgPath)) { return new SvgPath(pathString); }

  // Array of path segments.
  // Each segment is array [command, param1, param2, ...]
  this.segments = this.parsePath(pathString);
}


var pathCommands = /[MmZzLlHhVvCcSsQqTtAa][^MmZzLlHhVvCcSsQqTtAa]*/gm;
var pathValues = /[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/g;


// Parser code is shamelessly borrowed from Raphael
// https://github.com/DmitryBaranovskiy/raphael/
//
SvgPath.prototype.parsePath = function(pathString) {

  if (!pathString) { return []; }

  var data = [];
  var paramCounts = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 };

  pathString.replace(pathCommands, function(segmentString) {
    var cmd = segmentString[0]; // first character of segment is a command name
    var paramsStr = segmentString.substr(1); // get command parameters - all except command name
    var cmdLowerCase = cmd.toLowerCase();
    var params = [];

    paramsStr.replace(pathValues, function(paramStr) {
      params.push(+paramStr);
    });

    if (cmdLowerCase === "m" && params.length > 2) {
      data.push([cmd].concat(params.splice(0, 2)));
      cmdLowerCase = "l";
      cmd = (cmd === "m") ? "l" : "L";
    }

    if (cmdLowerCase === "r") {
      data.push([cmd].concat(params));
    } else {

      while (params.length >= paramCounts[cmdLowerCase]) {
        data.push([cmd].concat(params.splice(0, paramCounts[cmdLowerCase])));
        if (!paramCounts[cmdLowerCase]) {
          break;
        }
      }
    }
  });

  // First command MUST be always M or m.
  // Make it always M, to avoid unnecesary checks in translate/abs
  if (data[0][0].toLowerCase() !== 'm') {
    data = [];
  } else {
    data[0][0] = 'M';
  }

  return data;
};


// Convert processed SVG Path back to string
//
SvgPath.prototype.toString = function() {
  return [].concat.apply([], this.segments).join(' ')
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
SvgPath.prototype.translate = function(x, y) {
  y = y || 0;

  this.segments.forEach(function(segment) {

    var cmd = segment[0];

    // Shift coords only for commands with absolute values
    if ('ACHLMRQSTVZ'.indexOf(cmd) === -1) { return; }

    var name   = cmd.toLowerCase();

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

    // All other commands have [cmd, x1, y1, x2, y2, x3, y3, ...] format
    segment.forEach(function(val, i) {
      if (!i) { return; } // skip command
      segment[i] = i % 2 ? val + x : val + y;
    });
  });

  return this;
};


// Scale coords to (sx [, sy])
// sy = sx if not defined
//
SvgPath.prototype.scale = function(sx, sy) {
  sy = (!sy && (sy !== 0)) ? sx : sy;

  this.segments.forEach(function(segment) {

    var name   = segment[0].toLowerCase();

    // V & v are the only command, with shifted coords parity
    if (name === 'v') {
      segment[1] *= sy;
      return;
    }

    // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
    // touch rx, ry, x, y only
    if (name === 'a') {
      segment[1] *= sx;
      segment[2] *= sy;
      segment[6] *= sx;
      segment[7] *= sy;
      return;
    }

    // All other commands have [cmd, x1, y1, x2, y2, x3, y3, ...] format
    segment.forEach(function(val, i) {
      if (!i) { return; } // skip command
      segment[i] *= i % 2 ? sx : sy;
    });
  });

  return this;
};


// Round coords with given decimal precition.
// 0 by default (to integers)
//
SvgPath.prototype.round = function(d) {
  d = d || 0;

  this.segments.forEach(function(segment) {

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

    segment.forEach(function(val, i) {
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
SvgPath.prototype.iterate = function(iterator) {
  var segments = this.segments
    , replaceQueue = []
    , lastX = 0
    , lastY = 0
    , countourStartX = 0
    , countourStartY = 0;
  var index, isRelative;

  segments.forEach(function(segment, index) {

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
  for (index = len - 1; index >= 0 ; index--) {
    segments.splice(replaceQueue[index].index, 1);

    // FIXME: Replace cycle with `apply`
    var newSegLen = replaceQueue[index].segments.length;
    for (var newSegIndex = newSegLen - 1; newSegIndex >= 0 ; newSegIndex--) {
      segments.splice(replaceQueue[index].index, 0, replaceQueue[index].segments[newSegIndex]);
    }
  }

  return this;
};


// Converts segments from relative to absolute
//
SvgPath.prototype.abs = function () {

  this.iterate(function(segment, index, x, y) {
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

    segment.forEach(function(val, i) {
      if (!i) { return; } // skip command
      segment[i] = i % 2 ? val + x : val + y; // odd values are X, even - Y
    });

  });

  return this;
};


// Converts segments from absolute to relative
//
SvgPath.prototype.rel = function () {

  this.iterate(function(segment, index, x, y) {
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

    segment.forEach(function(val, i) {
      if (!i) { return; } // skip command
      segment[i] = i % 2 ? val - x : val - y; // odd values are X, even - Y
    });

  });

  return this;
};


// Converts smooth curves (with missed control point) to generic curves
//
SvgPath.prototype.unshort = function() {
  var self = this;
  var prevControlX, prevControlY;
  var curControlX, curControlY;

  this.iterate(function(segment, index, x, y) {
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
