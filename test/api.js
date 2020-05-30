'use strict';


var assert  = require('assert');
var svgpath = require('../');


describe('API', function () {

  describe('from', function () {
    it('string', function () {
      assert.equal(
        svgpath.from('M0 0 L 10 10').scale(2, 2).toString(),
        'M0 0L20 20'
      );
    });

    it('SvgPath instance', function () {
      assert.equal(
        svgpath.from(svgpath.from('M0 0 L 10 10').scale(2, 2)).toString(),
        'M0 0L20 20'
      );
    });

    it('invalid', function () {
      assert.throws(function () { svgpath.from([]); });
    });
  });

  describe('toString', function () {
    it('should not collapse multiple M', function () {
      assert.equal(
        svgpath('M 10 10 M 10 100 M 100 100 M 100 10 Z').toString(),
        'M10 10M10 100M100 100M100 10Z'
      );
    });

    it('should not collapse multiple m', function () {
      assert.equal(
        svgpath('m 10 10 m 10 100 m 100 100 m 100 10 z').toString(),
        'M10 10m10 100m100 100m100 10z'
      );
    });
  });

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

    it('should handle relative paths', function () {
      assert.equal(
        svgpath('M30 50 c 10 30, 30 30, 40 0 s 30 -30, 40 0').unshort().toString(),
        'M30 50c10 30 30 30 40 0 10-30 30-30 40 0'
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

    it('should handle relative paths', function () {
      assert.equal(
        svgpath('M30 50 q 20 20, 40 0 t 40 0').unshort().toString(),
        'M30 50q20 20 40 0 20-20 40 0'
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

    it('should track position after z', function () {
      assert.equal(
        svgpath('M10 10 l10 0 l0 10 Z l 0 10 l 10 0 z l-1-1').abs().toString(),
        'M10 10L20 10 20 20ZL10 20 20 20ZL9 9'
      );
    });
  });


  describe('rel', function () {
    it('should convert line', function () {
      assert.equal(
        svgpath('M10 10 L30 30').rel().toString(),
        'M10 10l20 20'
      );
    });

    it("shouldn't process existing line", function () {
      assert.equal(
        svgpath('m10 10 l30 30').rel().toString(),
        'M10 10l30 30'
      );
    });

    it('should convert multi-segment curve', function () {
      assert.equal(
        svgpath('M10 10 C 20 40 40 40 50 10 60 -20 70 -20 90 10').rel().toString(),
        'M10 10c10 30 30 30 40 0 10-30 20-30 40 0'
      );
    });

    it('should handle horizontal lines', function () {
      assert.equal(
        svgpath('M10 10H40h50').rel().toString(),
        'M10 10h30 50'
      );
    });

    it('should handle vertical lines', function () {
      assert.equal(
        svgpath('M10 10V40v50').rel().toString(),
        'M10 10v30 50'
      );
    });

    it('should handle arcs', function () {
      assert.equal(
        svgpath('M40 30A20 40 -45 0 1 60 80').rel().toString(),
        'M40 30a20 40-45 0 1 20 50'
      );
    });

    it('should track position after z', function () {
      assert.equal(
        svgpath('M10 10 L20 10 L20 20 Z L10 20 L20 20 z L9 9').rel().toString(),
        'M10 10l10 0 0 10zl0 10 10 0zl-1-1'
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
        svgpath('M40 30a20 40 -45 0 1 20 50').scale(2, 1.5).round(0).toString(),
        'M80 45a72 34 32.04 0 1 40 75'
      );

      assert.equal(
        svgpath('M40 30A20 40 -45 0 1 20 50').scale(2, 1.5).round(0).toString(),
        'M80 45A72 34 32.04 0 1 40 75'
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

    it('rotate abs arc', function () {
      assert.equal(
        svgpath('M 100 100 A 90 30 0 1 1 200 200').rotate(45).round(0).toString(),
        'M0 141A90 30 45 1 1 0 283'
      );
    });

    it('rotate rel arc', function () {
      assert.equal(
        svgpath('M 100 100 a 90 30 15 1 1 200 200').rotate(20).round(0).toString(),
        'M60 128a90 30 35 1 1 119 257'
      );
    });
  });

  describe('skew', function () {
    // SkewX matrix [ 1, 0, 4, 1, 0, 0 ],
    // x = x*1 + y*4 + 0 = x + y*4
    // y = x*0 + y*1 + 0 = y
    it('skewX', function () {
      assert.equal(
        svgpath('M5 5L15 20').skewX(75.96).round(0).toString(),
        'M25 5L95 20'
      );
    });

    // SkewY matrix [ 1, 4, 0, 1, 0, 0 ],
    // x = x*1 + y*0 + 0 = x
    // y = x*4 + y*1 + 0 = y + x*4
    it('skewY', function () {
      assert.equal(
        svgpath('M5 5L15 20').skewY(75.96).round(0).toString(),
        'M5 25L15 80'
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

    it('should handle arcs', function () {
      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 20 50').matrix([ 1.5, 0.5, 0.5, 1.5, 10, 15 ]).round(0).toString(),
        'M85 80a80 20 45 0 1 55 85'
      );

      assert.equal(
        svgpath('M40 30A20 40 -45 0 1 20 50').matrix([ 1.5, 0.5, 0.5, 1.5, 10, 15 ]).round(0).toString(),
        'M85 80A80 20 45 0 1 65 100'
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
        svgpath('M40 30a20 40 -45 0 1 20 50').translate(10, 15).round(0).toString(),
        'M50 45a40 20 45 0 1 20 50'
      );

      assert.equal(
        svgpath('M40 30A20 40 -45 0 1 20 50').translate(10, 15).round(0).toString(),
        'M50 45A40 20 45 0 1 30 65'
      );
    });
  });


  describe('round', function () {
    it('should round arcs', function () {
      assert.equal(
        svgpath('M10 10 A12.5 17.5 45.5 0 0 15.5 19.5').round(0).toString(),
        'M10 10A13 18 45.5 0 0 16 20'
      );
    });

    it('should round curves', function () {
      assert.equal(
        svgpath('M10 10 c 10.12 30.34 30.56 30 40.00 0.12').round(0).toString(),
        'M10 10c10 30 31 30 40 0'
      );
    });

    it('set precision', function () {
      assert.equal(
        svgpath('M10.123 10.456L20.4351 30.0000').round(2).toString(),
        'M10.12 10.46L20.44 30'
      );
    });

    it('should track errors', function () {
      assert.equal(
        svgpath('M1.2 1.4l1.2 1.4 l1.2 1.4').round(0).toString(),
        'M1 1l1 2 2 1'
      );
    });

    it('should track errors #2', function () {
      assert.equal(
        svgpath('M1.2 1.4 H2.4 h1.2 v2.4 h-2.4 V2.4 v-1.2').round(0).toString(),
        'M1 1H2h2v3h-3V2v-1'
      );
    });

    it('should track errors for contour start', function () {
      assert.equal(
        svgpath('m0.4 0.2zm0.4 0.2m0.4 0.2m0.4 0.2zm0.4 0.2').round(0).abs().toString(),
        'M0 0ZM1 0M1 1M2 1ZM2 1'
      );
    });

    it('reset delta error on contour end', function () {
      assert.equal(
        svgpath('m.1 .1l.3 .3zm.1 .1l.3 .3zm0 0z').round(0).abs().toString(),
        'M0 0L0 0ZM0 0L1 1ZM0 0Z'
      );
    });
  });


  describe('unarc', function () {
    it('almost complete arc gets expanded to 4 curves', function () {
      assert.equal(
        svgpath('M100 100 A30 50 0 1 1 110 110').unarc().round(0).toString(),
        'M100 100C89 83 87 54 96 33 105 12 122 7 136 20 149 33 154 61 147 84 141 108 125 119 110 110'
      );
    });

    it('small arc gets expanded to one curve', function () {
      assert.equal(
        svgpath('M100 100 a30 50 0 0 1 30 30').unarc().round(0).toString(),
        'M100 100C113 98 125 110 130 130'
      );
    });

    it('unarc a circle', function () {
      assert.equal(
        svgpath('M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0').unarc().round(0).toString(),
        'M100 100m-75 0C25 141 59 175 100 175 141 175 175 141 175 100 175 59 141 25 100 25 59 25 25 59 25 100'
      );
    });

    it('rounding errors', function () {
      // Coverage
      //
      // Due to rounding errors, with these exact arguments radicant
      // will be -9.974659986866641e-17, causing Math.sqrt() of that to be NaN
      //
      assert.equal(
        svgpath('M-0.5 0 A 0.09188163040671497 0.011583783896639943 0 0 1 0 0.5').unarc().round(5).toString(),
        'M-0.5 0C0.59517-0.01741 1.59491 0.08041 1.73298 0.21848 1.87105 0.35655 1.09517 0.48259 0 0.5'
      );
    });

    it('rounding errors #2', function () {
      // Coverage
      //
      // Due to rounding errors this will compute Math.acos(-1.0000000000000002)
      // and fail when calculating vector between angles
      //
      assert.equal(
        svgpath('M-0.07467194809578359 -0.3862391309812665' +
            'A1.2618792965076864 0.2013618852943182 90 0 1 -0.7558937461581081 -0.8010219619609416')
          .unarc().round(5).toString(),

        'M-0.07467-0.38624C-0.09295 0.79262-0.26026 1.65542-0.44838 1.54088' +
        '-0.63649 1.42634-0.77417 0.37784-0.75589-0.80102'
      );
    });

    it("we're already there", function () {
      // Asked to draw a curve between a point and itself. According to spec,
      // nothing shall be drawn in this case.
      //
      assert.equal(
        svgpath('M100 100A123 456 90 0 1 100 100').unarc().round(0).toString(),
        'M100 100L100 100'
      );

      assert.equal(
        svgpath('M100 100a123 456 90 0 1 0 0').unarc().round(0).toString(),
        'M100 100l0 0'
      );
    });

    it('radii are zero', function () {
      // both rx and ry are zero
      assert.equal(
        svgpath('M100 100A0 0 0 0 1 110 110').unarc().round(0).toString(),
        'M100 100L110 110'
      );

      // rx is zero
      assert.equal(
        svgpath('M100 100A0 100 0 0 1 110 110').unarc().round(0).toString(),
        'M100 100L110 110'
      );
    });
  });


  describe('arc transform edge cases', function () {
    it('replace arcs rx/ry = 0 with lines', function () {
      assert.equal(
        svgpath('M40 30a0 40 -45 0 1 20 50Z M40 30A20 0 -45 0 1 20 50Z').scale(2, 2).toString(),
        'M80 60l40 100ZM80 60L40 100Z'
      );
    });

    it('drop arcs with end point === start point', function () {
      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 0 0').scale(2, 2).toString(),
        'M80 60l0 0'
      );

      assert.equal(
        svgpath('M40 30A20 40 -45 0 1 40 30').scale(2, 2).toString(),
        'M80 60L80 60'
      );
    });

    it('to line at scale x|y = 0 ', function () {
      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 20 50').scale(0, 1).toString(),
        'M0 30l0 50'
      );

      assert.equal(
        svgpath('M40 30A20 40 -45 0 1 20 50').scale(1, 0).toString(),
        'M40 0L20 0'
      );
    });

    it('rotate to +/- 90 degree', function () {
      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 20 50').rotate(90).round(0).toString(),
        'M-30 40a20 40 45 0 1-50 20'
      );

      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 20 50').matrix([ 0, 1, -1, 0, 0, 0 ]).round(0).toString(),
        'M-30 40a20 40 45 0 1-50 20'
      );

      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 20 50').rotate(-90).round(0).toString(),
        'M30-40a20 40 45 0 1 50-20'
      );

      assert.equal(
        svgpath('M40 30a20 40 -45 0 1 20 50').matrix([ 0, -1, 1, 0, 0, 0 ]).round(0).toString(),
        'M30-40a20 40 45 0 1 50-20'
      );
    });

    it('process circle-like segments', function () {
      assert.equal(
        svgpath('M50 50A30 30 -45 0 1 100 100').scale(0.5).round(0).toString(),
        'M25 25A15 15 0 0 1 50 50'
      );
    });

    it('almost zero eigen values', function () {
      assert.equal(
        svgpath('M148.7 277.9A228.7 113.2 90 1 0 159.3 734.8').translate(10).round(1).toString(),
        'M158.7 277.9A228.7 113.2 90 1 0 169.3 734.8'
      );
    });

    it('should flip sweep flag if image is flipped', function () {
      assert.equal(
        svgpath('M10 10A20 15 90 0 1 30 10').scale(1, -1).translate(0, 40).toString(),
        'M10 30A20 15 90 0 0 30 30'
      );

      assert.equal(
        svgpath('M10 10A20 15 90 0 1 30 10').scale(-1, -1).translate(40, 40).toString(),
        'M30 30A20 15 90 0 1 10 30'
      );
    });
  });
});
