/*global describe, it*/

'use strict';


var assert  = require('assert');
var svgpath = require('../');


describe('API', function () {

  describe('unshort - cubic', function () {
    it("shouldn't change full arc", function () {
      assert.equal(
        svgpath('M10 10 C 20 20, 40 20, 50 10').unshort().toString(),
        'M10 10C20 20 40 20 50 10'
      );
    });

    it('should reflect control point after full path', function () {
      assert.equal(
        svgpath('M10 10 C 20 20, 40 20, 50 10 S 80 0, 90 10').unshort().toString(),
        'M10 10C20 20 40 20 50 10 60 0 80 0 90 10'
      );
    });

    it('should copy starting point if not followed by a path', function () {
      assert.equal(
        svgpath('M10 10 S 50 50, 90 10').unshort().toString(),
        'M10 10C10 10 50 50 90 10'
      );
    });

    it.skip('should handle relative paths', function () {
      assert.equal(
        svgpath('M30 50 c 10 30, 30 30, 40 0 s 30 -30, 40 0').unshort().toString(),
        'M30 50 c10 30 30 30 40 0 10 -30 30 -30 40 0'
      );
    });
  });


  describe('unshort - quadratic', function () {
    it("shouldn't change full arc", function () {
      assert.equal(
        svgpath('M10 10 Q 50 50, 90 10').unshort().toString(),
        'M10 10Q50 50 90 10'
      );
    });

    it('should reflect control point after full path', function () {
      assert.equal(
        svgpath('M30 50 Q 50 90, 90 50 T 150 50').unshort().toString(),
        'M30 50Q50 90 90 50 130 10 150 50'
      );
    });

    it('should copy starting point if not followed by a path', function () {
      assert.equal(
        svgpath('M10 30 T150 50').unshort().toString(),
        'M10 30Q10 30 150 50'
      );
    });

    it.skip('should handle relative paths', function () {
      assert.equal(
        svgpath('M30 50 q 20 20, 40 0 t 40 0').unshort().toString(),
        'M30 50q20 20 40 0 20 -20 40 0'
      );
    });
  });


  describe('abs', function () {
    it('should convert line', function () {
      assert.equal(
        svgpath('M10 10 l 30 30').abs().toString(),
        'M10 10L40 40'
      );
    });

    it("shouldn't process existing line", function () {
      assert.equal(
        svgpath('M10 10 L30 30').abs().toString(),
        'M10 10L30 30'
      );
    });

    it('should convert multi-segment curve', function () {
      assert.equal(
        svgpath('M10 10 c 10 30 30 30 40, 0 10 -30 20 -30 40 0').abs().toString(),
        'M10 10C20 40 40 40 50 10 60-20 70-20 90 10'
      );
    });

    it('should handle horizontal lines', function () {
      assert.equal(
        svgpath('M10 10H40h50').abs().toString(),
        'M10 10H40 90'
      );
    });

    it('should handle vertical lines', function () {
      assert.equal(
        svgpath('M10 10V40v50').abs().toString(),
        'M10 10V40 90'
      );
    });

    it('should handle arcs', function () {
      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 20 50').abs().toString(),
        'M40 30A20 40-45 0 1 60 80'
      );
    });
  });


  describe('rel', function () {
    it('should convert line', function () {
      assert.equal(
        svgpath('M10 10 L30 30').rel().toString(),
        'm10 10l20 20'
      );
    });

    it("shouldn't process existing line", function () {
      assert.equal(
        svgpath('m10 10 l30 30').rel().toString(),
        'm10 10l30 30'
      );
    });

    it('should convert multi-segment curve', function () {
      assert.equal(
        svgpath('M10 10 C 20 40 40 40 50 10 60 -20 70 -20 90 10').rel().toString(),
        'm10 10c10 30 30 30 40 0 10-30 20-30 40 0'
      );
    });

    it('should handle horizontal lines', function () {
      assert.equal(
        svgpath('M10 10H40h50').rel().toString(),
        'm10 10h30 50'
      );
    });

    it('should handle vertical lines', function () {
      assert.equal(
        svgpath('M10 10V40v50').rel().toString(),
        'm10 10v30 50'
      );
    });

    it('should handle arcs', function () {
      assert.equal(
        svgpath('M40 30A20 40 -45 0 1 60 80').rel().toString(),
        'm40 30a20 40-45 0 1 20 50'
      );
    });
  });


  describe('scale', function () {
    it('should scale abs curve', function () {
      assert.equal(
        svgpath('M10 10 C 20 40 40 40 50 10').scale(2, 1.5).toString(),
        'M20 15C40 60 80 60 100 15'
      );
    });

    it('should scale rel curve', function () {
      assert.equal(
        svgpath('M10 10 c 10 30 30 30 40 0').scale(2, 1.5).toString(),
        'M20 15c20 45 60 45 80 0'
      );
    });

    it('second argument defaults to the first', function () {
      assert.equal(
        svgpath('M10 10l20 30').scale(2).toString(),
        'M20 20l40 60'
      );
    });

    it('should handle horizontal lines', function () {
      assert.equal(
        svgpath('M10 10H40h50').scale(2, 1.5).toString(),
        'M20 15H80h100'
      );
    });

    it('should handle vertical lines', function () {
      assert.equal(
        svgpath('M10 10V40v50').scale(2, 1.5).toString(),
        'M20 15V60v75'
      );
    });

    it('should handle arcs', function () {
      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 20 50').scale(2, 1.5).toString(),
        'M80 45a40 60-45 0 1 40 75'
      );

      assert.equal(
        svgpath('M40 30A20 40 -45 0 1 20 50').scale(2, 1.5).toString(),
        'M80 45A40 60-45 0 1 40 75'
      );
    });
  });


  describe('rotate', function () {
    it('rotate by 90 degrees about point(10, 10)', function () {
      assert.equal(
        svgpath('M10 10L15 10').rotate(90, 10, 10).round(0).toString(),
        'M10 10L10 15'
      );
    });

    it('rotate by -90 degrees about point (0,0)', function () {
      assert.equal(
        svgpath('M0 10L0 20').rotate(-90).round(0).toString(),
        'M10 0L20 0'
      );
    });
  });


  describe('matrix', function () {
    // x = x*1.5 + y/2 + ( absolute ? 10 : 0)
    // y = x/2 + y*1.5 + ( absolute ? 15 : 0)
    it('path with absolute segments', function () {
      assert.equal(
        svgpath('M5 5 C20 30 10 15 30 15').matrix([ 1.5, 0.5, 0.5, 1.5, 10, 15 ]).toString(),
        'M20 25C55 70 32.5 42.5 62.5 52.5'
      );
    });

    it('path with relative segments', function () {
      assert.equal(
        svgpath('M5 5 c10 12 10 15 20 30').matrix([ 1.5, 0.5, 0.5, 1.5, 10, 15 ]).toString(),
        'M20 25c21 23 22.5 27.5 45 55'
      );
    });

    it('no change', function () {
      assert.equal(
        svgpath('M5 5 C20 30 10 15 30 15').matrix([ 1, 0, 0, 1, 0, 0 ]).toString(),
        'M5 5C20 30 10 15 30 15'
      );
    });
  });


  describe('combinations', function () {
    it('scale + translate', function () {
      assert.equal(
        svgpath('M0 0 L 10 10 20 10').scale(2, 3).translate(100, 100).toString(),
        'M100 100L120 130 140 130'
      );
    });

    it('scale + rotate', function () {
      assert.equal(
        svgpath('M0 0 L 10 10 20 10').scale(2, 3).rotate(90).round(0).toString(),
        'M0 0L-30 20-30 40'
      );
    });

    it('empty', function () {
      assert.equal(
        svgpath('M0 0 L 10 10 20 10').translate(0).scale(1).rotate(0, 10, 10).round(0).toString(),
        'M0 0L10 10 20 10'
      );
    });
  });


  describe('translate', function () {
    it('should translate abs curve', function () {
      assert.equal(
        svgpath('M10 10 C 20 40 40 40 50 10').translate(5, 15).toString(),
        'M15 25C25 55 45 55 55 25'
      );
    });

    it('should translate rel curve', function () {
      assert.equal(
        svgpath('M10 10 c 10 30 30 30 40 0').translate(5, 15).toString(),
        'M15 25c10 30 30 30 40 0'
      );
    });

    it('second argument defaults to zero', function () {
      assert.equal(
        svgpath('M10 10L20 30').translate(10).toString(),
        'M20 10L30 30'
      );
    });

    it('should handle horizontal lines', function () {
      assert.equal(
        svgpath('M10 10H40h50').translate(10, 15).toString(),
        'M20 25H50h50'
      );
    });

    it('should handle vertical lines', function () {
      assert.equal(
        svgpath('M10 10V40v50').translate(10, 15).toString(),
        'M20 25V55v50'
      );
    });

    it('should handle arcs', function () {
      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 20 50').translate(10, 15).toString(),
        'M50 45a20 40-45 0 1 20 50'
      );

      assert.equal(
        svgpath('M40 30A20 40 -45 0 1 20 50').translate(10, 15).toString(),
        'M50 45A20 40-45 0 1 30 65'
      );
    });
  });


  describe('round', function () {
    it('should round arcs', function () {
      assert.equal(
        svgpath('M10 10 A12.5 17.5 45.5 0 0 15.5 19.5').round().toString(),
        'M10 10A13 18 45.5 0 0 16 20'
      );
    });

    it('should round curves', function () {
      assert.equal(
        svgpath('M10 10 c 10.12 30.34 30.56 30 40.00 0.12').round().toString(),
        'M10 10c10 30 31 30 40 0'
      );
    });

    it('set precision', function () {
      assert.equal(
        svgpath('M10.123 10.456L20.4351 30.0000').round(2).toString(),
        'M10.12 10.46L20.44 30'
      );
    });
  });
});
