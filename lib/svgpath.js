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
var a2c            = require('./a2c');
var ellipse        = require('./ellipse');
var box        = require('./box');


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

// copy path
//
SvgPath.prototype.copy = function () {
  var newP = new SvgPath('');
  var i;

  // copy segments
  for (i = 0; i < this.segments.length; i++) {
    newP.segments[i] = this.segments[i].slice(0);
  }

  // copy err
  newP.err = this.err;

  // copy __stack
  for (i = 0; i < this.__stack.length; i++) {
    newP.matrix(this.__stack[i].toArray());
  }

  return newP;
};

SvgPath.prototype.__matrix = function (m) {
  var self = this,
      ma, sx, sy, angle, arc2line, i;

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

        // Drop segment if arc is empty (end point === start point)
        if ((s[0] === 'A' && s[6] === x && s[7] === y) ||
            (s[0] === 'a' && s[6] === 0 && s[7] === 0)) {
          return [];
        }

        // Transform rx, ry and the x-axis-rotation
        var e = ellipse(s[1], s[2], s[3]).transform(m.toArray());

        // Transform end point as usual (without translation for relative notation)
        p = m.calc(s[6], s[7], s[0] === 'a');

        // if the resulting ellipse is (almost) a segment ...
        if (e.isDegenerate()) {
          // replace the arc by a line
          result = [ s[0] === 'a' ? 'l' : 'L', p[0], p[1] ];
        } else {
          // if it is a real ellipse
          // s[0], s[4] and s[5] are not modified
          result = [ s[0], e.rx, e.ry, e.ax, s[4], s[5], p[0], p[1] ];
        }

        break;

      case 'm':
        // Edge case. The very first `m` should be processed as absolute, if happens.
        // Make sense for coord shift transforms.
        isRelative = index > 0;

        p = m.calc(s[1], s[2], isRelative);
        result = [ 'm', p[0], p[1] ];
        break;

      default:
        name       = s[0];
        result     = [ name ];
        isRelative = (name.toLowerCase() === name);

        // Apply transformations to the segment
        for (i = 1; i < s.length; i += 2) {
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
  var elements = [], skipCmd, cmd;

  this.__evaluateStack();

  for (var i = 0; i < this.segments.length; i++) {
    // remove repeating commands names
    cmd = this.segments[i][0];
    skipCmd = i > 0 && cmd !== 'm' && cmd !== 'M' && cmd === this.segments[i - 1][0];
    elements = elements.concat(skipCmd ? this.segments[i].slice(1) : this.segments[i]);
  }

  return elements.join(' ')
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


// Transform path according to 'transform' attr of SVG spec
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
  var contourStartDeltaX = 0, contourStartDeltaY = 0, deltaX = 0, deltaY = 0, l;

  d = d || 0;

  this.__evaluateStack();

  this.segments.forEach(function (s) {
    var isRelative = (s[0].toLowerCase() === s[0]), t;

    switch (s[0]) {
      case 'H':
      case 'h':
        if (isRelative) { s[1] += deltaX; }
        deltaX = s[1] - s[1].toFixed(d);
        s[1] = +s[1].toFixed(d);
        return;

      case 'V':
      case 'v':
        if (isRelative) { s[1] += deltaY; }
        deltaY = s[1] - s[1].toFixed(d);
        s[1] = +s[1].toFixed(d);
        return;

      case 'Z':
      case 'z':
        contourStartDeltaX = deltaX;
        contourStartDeltaY = deltaY;
        return;

      case 'M':
      case 'm':
        if (isRelative) {
          s[1] += deltaX;
          s[2] += deltaY;
        }

        deltaX = s[1] - s[1].toFixed(d);
        deltaY = s[2] - s[2].toFixed(d);

        contourStartDeltaX = deltaX;
        contourStartDeltaY = deltaY;

        s[1] = +s[1].toFixed(d);
        s[2] = +s[2].toFixed(d);
        return;

      case 'A':
      case 'a':
        // [cmd, rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        if (isRelative) {
          s[6] += deltaX;
          s[7] += deltaY;
        }

        deltaX = s[6] - s[6].toFixed(d);
        deltaY = s[7] - s[7].toFixed(d);

        s[1] = +s[1].toFixed(d);
        s[2] = +s[2].toFixed(d);
        s[3] = +s[3].toFixed(d + 2); // better precision for rotation
        s[6] = +s[6].toFixed(d);
        s[7] = +s[7].toFixed(d);
        return;

      default:
        // a c l q s t
        l = s.length;

        if (isRelative) {
          s[l - 2] += deltaX;
          s[l - 1] += deltaY;
        }

        deltaX = s[l - 2] - s[l - 2].toFixed(d);
        deltaY = s[l - 1] - s[l - 1].toFixed(d);

        s.forEach(function (val, i) {
          if (!i) { return; }
          s[i] = +s[i].toFixed(d);
        });
        return;
    }
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

    var isRelative = (s[0] === s[0].toLowerCase());

    // calculate absolute X and Y
    switch (s[0]) {
      case 'm':
      case 'M':
        lastX = s[1] + (isRelative ? lastX : 0);
        lastY = s[2] + (isRelative ? lastY : 0);
        countourStartX = lastX;
        countourStartY = lastY;
        return;

      case 'h':
      case 'H':
        lastX = s[1] + (isRelative ? lastX : 0);
        return;

      case 'v':
      case 'V':
        lastY = s[1] + (isRelative ? lastY : 0);
        return;

      case 'z':
      case 'Z':
        // That make sence for multiple contours
        lastX = countourStartX;
        lastY = countourStartY;
        return;

      default:
        lastX = s[s.length - 2] + (isRelative ? lastX : 0);
        lastY = s[s.length - 1] + (isRelative ? lastY : 0);
    }
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

    switch (name) {
      case 'v':
        // v has shifted coords parity
        s[1] += y;
        return;

      case 'a':
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        // touch x, y only
        s[6] += x;
        s[7] += y;
        return;

      default:
        for (i = 1; i < s.length; i++) {
          s[i] += i % 2 ? x : y; // odd values are X, even - Y
        }
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

    // Don't touch the first M to avoid potential confusions.
    if (index === 0 && name === 'M') { return; }

    s[0] = nameLC;

    switch (name) {
      case 'V':
        // V has shifted coords parity
        s[1] -= y;
        return;

      case 'A':
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        // touch x, y only
        s[6] -= x;
        s[7] -= y;
        return;

      default:
        for (i = 1; i < s.length; i++) {
          s[i] -= i % 2 ? x : y; // odd values are X, even - Y
        }
    }
  }, true);

  return this;
};


// Converts arcs to cubic bézier curves
//
SvgPath.prototype.unarc = function () {
  this.iterate(function (s, index, x, y) {
    var i, new_segments, nextX, nextY, result = [], name = s[0];

    // Skip anything except arcs
    if (name !== 'A' && name !== 'a') { return null; }

    if (name === 'a') {
      // convert relative arc coordinates to absolute
      nextX = x + s[6];
      nextY = y + s[7];
    } else {
      nextX = s[6];
      nextY = s[7];
    }

    new_segments = a2c(x, y, nextX, nextY, s[4], s[5], s[1], s[2], s[3]);

    new_segments.forEach(function (s) {
      result.push([ 'C', s[2], s[3], s[4], s[5], s[6], s[7] ]);
    });

    return result;
  });

  return this;
};


// Converts smooth curves (with missed control point) to generic curves
//
SvgPath.prototype.unshort = function () {
  var segments = this.segments;
  var prevControlX, prevControlY, prevSegment;
  var curControlX, curControlY;

  // TODO: add lazy evaluation flag when relative commands supported

  this.iterate(function (s, idx, x, y) {
    var name = s[0], nameUC = name.toUpperCase(), isRelative;

    // First command MUST be M|m, it's safe to skip.
    // Protect from access to [-1] for sure.
    if (!idx) { return; }

    if (nameUC === 'T') { // quadratic curve
      isRelative = (name === 't');

      prevSegment = segments[idx - 1];

      if (prevSegment[0] === 'Q') {
        prevControlX = prevSegment[1] - x;
        prevControlY = prevSegment[2] - y;
      } else if (prevSegment[0] === 'q') {
        prevControlX = prevSegment[1] - prevSegment[3];
        prevControlY = prevSegment[2] - prevSegment[4];
      } else {
        prevControlX = 0;
        prevControlY = 0;
      }

      curControlX = -prevControlX;
      curControlY = -prevControlY;

      if (!isRelative) {
        curControlX += x;
        curControlY += y;
      }

      segments[idx] = [
        isRelative ? 'q' : 'Q',
        curControlX, curControlY,
        s[1], s[2]
      ];

    } else if (nameUC === 'S') { // cubic curve
      isRelative = (name === 's');

      prevSegment = segments[idx - 1];

      if (prevSegment[0] === 'C') {
        prevControlX = prevSegment[3] - x;
        prevControlY = prevSegment[4] - y;
      } else if (prevSegment[0] === 'c') {
        prevControlX = prevSegment[3] - prevSegment[5];
        prevControlY = prevSegment[4] - prevSegment[6];
      } else {
        prevControlX = 0;
        prevControlY = 0;
      }

      curControlX = -prevControlX;
      curControlY = -prevControlY;

      if (!isRelative) {
        curControlX += x;
        curControlY += y;
      }

      segments[idx] = [
        isRelative ? 'c' : 'C',
        curControlX, curControlY,
        s[1], s[2], s[3], s[4]
      ];
    }
  });

  return this;
};


// return the bounding box of an absolute normalized path.
// normalized = without arc segments (A) and without reduced segments (S,T)
//
SvgPath.prototype.getBoundingBox = function () {
  var bb = box();

  if (this.segments.length === 0) {
    return bb;
  }

  var P = this.copy().abs().unarc().unshort();

  P.iterate(function (s, i, x, y) {
    switch (s[0]) {
      case 'H':
        bb.addX(s[1]);
        break;
      case 'V':
        bb.addY(s[1]);
        break;
      case 'M':
      case 'L':
        bb.addX(s[1]);
        bb.addY(s[2]);
        break;
      case 'Q':
        bb.addXQ([ x, s[1], s[3] ]);
        bb.addYQ([ y, s[2], s[4] ]);
        break;
      case 'C':
        bb.addXC([ x, s[1], s[3], s[5] ]);
        bb.addYC([ y, s[2], s[4], s[6] ]);
        break;
    } // end switch
  }, true); // end iterate

  return bb;
};


// return a string that can be used as a viewBox for the path
//
SvgPath.prototype.toViewBoxString = function (pr) {
  return this.getBoundingBox().toViewBoxString(pr);
};

// translate and scale the path to fit in a box
// controlled by the following parameters :
// - type:
//  - fit(=none) : scale the path (aspect ratio is not preserved) to fit the box
//  - meet (the default) : scale the path (aspect ratio is preserved) as much as possible
//                         to fit the entire path in the box
//  - slice : scale the path (aspect ratio is preserved) as less as possible to cover the box
//  - move : translate only (no scale) the path according to x???y??? parameter
// - position x(Min|Mid|Max)Y(Min|Mid|Max).
//  example : .toBox('-10 10 300 400 meet xMidYMin')
//
SvgPath.prototype.toBox = function (parameters) {
  this.matrix(this.getBoundingBox().matrixToBox(parameters));

  return this;
};

module.exports = SvgPath;
