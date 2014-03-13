/*global describe, it*/

'use strict';

var assert  = require('assert');

var SvgPath = require('../');

describe('Transform', function () {

  describe('translate', function () {
    it('x only', function () {
      assert.equal('M30 10L35 15', new SvgPath('M10 10 L15 15').transform('translate(20)').toString());
    });
    it('x and y', function () {
      assert.equal('M30 20L35 25', new SvgPath('M10 10 L15 15').transform('translate(20,10)').toString());
    });
    it('x and y with relatives curves', function () {
      assert.equal('M30 20c15 15 20 10 15 15', new SvgPath('M10 10 c15 15, 20 10, 15 15').transform('translate(20,10)').toString());
    });
    it('x and y with absolute curves', function () {
      assert.equal('M30 20C35 25 40 20 35 25', new SvgPath('M10 10 C15 15, 20 10, 15 15').transform('translate(20,10)').toString());
    });
  });

  describe('rotate', function () {
    it('rotate by 90 degrees about point(10, 10)', function () {
      assert.equal('M10 10L10 15', new SvgPath('M10 10L15 10').transform('rotate(90, 10, 10)').round(0).toString());
    });
    it('rotate by -90 degrees about point (0,0)', function () {
      assert.equal('M10 0L20 0', new SvgPath('M0 10L0 20').transform('rotate(-90)').round(0).toString());
    });
  });

  describe('scale', function () {
    it('scale picture by 2', function () {
      assert.equal('M10 10L30 40', new SvgPath('M5 5L15 20').transform('scale(2)').toString());
    });
    it('scale picture with x*0.5 and y*1.5', function () {
      assert.equal('M2.5 7.5L15 30', new SvgPath('M5 5L30 20').transform('scale(.5, 1.5)').toString());
    });
    it('scale picture with x*0.5 and y*1.5 with relative elements', function () {
      assert.equal('M2.5 7.5c7.5 22.5 10 15 7.5 22.5', new SvgPath('M5 5c15 15, 20 10, 15 15').transform('scale(.5, 1.5)').toString());
    });
  });

  describe('skew', function () {
    // SkewX matrix [ 1, 0, 4, 1, 0, 0 ],
    // x = x*1 + y*4 + 0 = x + y*4
    // y = x*0 + y*1 + 0 = y
    it('skewX', function () {
      assert.equal('M25 5L95 20', new SvgPath('M5 5L15 20').transform('skewX(75.96)').round(0).toString());
    });
    // SkewY matrix [ 1, 4, 0, 1, 0, 0 ],
    // x = x*1 + y*0 + 0 = x
    // y = x*4 + y*1 + 0 = y + x*4
    it('skewY', function () {
      assert.equal('M5 25L15 80', new SvgPath('M5 5L15 20').transform('skewY(75.96)').round(0).toString());
    });
  });

  describe('matrix', function () {
    // x = x*1.5 + y/2 + ( absolute ? 10 : 0)
    // y = x/2 + y*1.5 + ( absolute ? 15 : 0)
    it('path with absolute segments', function () {
      assert.equal(
        'M20 25C55 70 32.5 42.5 62.5 52.5',
        new SvgPath('M5 5 C20 30 10 15 30 15').transform('matrix(1.5, 0.5, 0.5, 1.5 10, 15)').toString()
      );
    });
    it('path with relative segments', function () {
      assert.equal(
        'M20 25c21 23 22.5 27.5 45 55',
        new SvgPath('M5 5 c10 12 10 15 20 30').transform('matrix(1.5, 0.5, 0.5, 1.5 10, 15)').toString()
      );
    });
  });

  describe('segment replacement', function () {
    it('[H,V] => L', function () {
      assert.equal(
        'M100 100L110 100 110 110ZM200 200L215 200 215 190',
        new SvgPath('M0 0 H 10 V 10 Z M 100 100 h 15 v -10').transform('translate(100,100)').toString()
      );
    });
  });

  describe('multiple transforms', function () {
    it('scale + translate', function () {
      assert.equal(
        'M100 100L120 130 140 130',
        new SvgPath('M0 0 L 10 10 20 10').transform('translate(100,100) scale(2,3)').toString()
      );
    });
    it('scale + rotate', function () {
      assert.equal(
        'M0 0L-30 20-30 40',
        new SvgPath('M0 0 L 10 10 20 10').transform('rotate(90) scale(2,3)').round(0).toString()
      );
    });
    it('rotate + skewX', function () {
      assert.equal(
        'M0 0L140 30 160 30',
        new SvgPath('M0 0 L 10 10 20 10').transform('skewX(75.96) scale(2,3)').round(0).toString()
      );
    });
  });

});
