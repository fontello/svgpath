'use strict';


var path  = ''  // path string
  , index = 0   // current position
  , len   = 0;  // path length

var paramCounts = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 };


function isSpace(ch) {
  return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029) || // Line terminators
    // White spaces
    (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
    (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
}


function skipSpaces() {
  while (index < len) {
    if (!isSpace(path[index].charCodeAt(0))) { return; }
    index++;
  }
}


function isCommand(cmd) {
  return 'MmZzLlHhVvCcSsQqTtAaRr'.indexOf(cmd) >= 0;
}


function isDigit(code) {
  return (code >= 48 && code <= 57);   // 0..9
}


function scanParam() {
  var number = ''
    , ch = path[index];

  if (ch === '+' || ch === '-') {
    number += path[index++];
    ch = path[index];
  }

  // This logic is shamelessly borrowed from Esprima
  // https://github.com/ariya/esprimas
  //
  if (!isDigit(ch.charCodeAt(0)) && ch !== '.') {
    throw 'param should start with 0..9 or "." (at pos ' + index + ')';
  }

  if (ch !== '.') {
    number += path[index++];
    ch = path[index];

    if (number === '0') {
      // decimal number starts with '0' such as '09' is illegal.
      if (ch && isDigit(ch.charCodeAt(0))) {
        throw  'numbers started with "0" such as "09" are ilegal (at pos ' + (index-1) + ')';
      }
    }

    while (isDigit(path.charCodeAt(index))) {
      number += path[index++];
    }
    ch = path[index];
  }

  if (ch === '.') {
    number += path[index++];
    while (isDigit(path.charCodeAt(index))) {
      number += path[index++];
    }
    ch = path[index];
  }

  if (ch === 'e' || ch === 'E') {
    number += path[index++];

    ch = path[index];
    if (ch === '+' || ch === '-') {
      number += path[index++];
    }
    if (isDigit(path.charCodeAt(index))) {
      while (isDigit(path.charCodeAt(index))) {
        number += path[index++];
      }
    } else {
      throw 'Invalid float exponent (at pos ' + index + ')';
    }
  }

  return parseFloat(number);
}

function scanSegment(result) {
  var params = [];

  var cmd   = path[index++]
    , cmdLC = cmd.toLowerCase();

  if (!isCommand(cmd)) {
    throw 'bad command ' + cmd + ' at ' + (index-1);
  }

  skipSpaces();

  while (index < len) {
    // Stop on next segment
    if (isCommand(path[index])) { break; }

    params.push(scanParam());
    // after ',' command is mandatory
    while (index < len && path[index] === ',') {
      index++;
      skipSpaces();
      params.push(scanParam());
    }
    skipSpaces();
  }

  // Prosess duplicated commands (without comand name)

  // This logic is shamelessly borrowed from Raphael
  // https://github.com/DmitryBaranovskiy/raphael/
  //
  if (cmdLC === "m" && params.length > 2) {
    result.push([cmd].concat(params.splice(0, 2)));
    cmdLC = "l";
    cmd = (cmd === "m") ? "l" : "L";
  }

  if (cmdLC === "r") {
    result.push([cmd].concat(params));
  } else {

    while (params.length >= paramCounts[cmdLC]) {
      result.push([cmd].concat(params.splice(0, paramCounts[cmdLC])));
      if (!paramCounts[cmdLC]) {
        break;
      }
    }
  }
}

/* Returns array of segments:
 *
 * [
 *   [ command, coord1, coord2, ... ]
 * ]
 */
module.exports = function pathParse(svgPath) {
  path  = svgPath;
  len   = path.length;
  index = 0;

  var result = [];

  skipSpaces();

  while (index < len) {
    scanSegment(result);
    skipSpaces();
  }

  if (result.length) {
    if (result[0][0].toLowerCase() !== 'm') {
      result = [];
    } else {
      result[0][0] = 'M';
    }
  }

  return result;
};
