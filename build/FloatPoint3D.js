'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var mathUtils = require('./mathUtils');

/**
 * 3D point class for panner, listener, etc.
 * The original idea is from chromium's Web Audio API implementation.
 https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/platform/geometry/FloatPoint3D.h
 */

var FloatPoint3D = function () {

  /**
   * @param {number} [x=0]
   * @param {number} [y=0]
   * @param {number} [z=0]
   */
  function FloatPoint3D(x, y, z) {
    _classCallCheck(this, FloatPoint3D);

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  }

  /**
   * @return {boolean}
   */


  _createClass(FloatPoint3D, [{
    key: 'isZero',
    value: function isZero() {
      return !this.x && !this.y && !this.z;
    }
  }, {
    key: 'normalize',
    value: function normalize() {
      var tempNorm = this.norm();
      if (tempNorm) {
        this.x /= tempNorm;
        this.y /= tempNorm;
        this.z /= tempNorm;
      }
    }

    /**
     * @param {FloatPoint3D} a
     */

  }, {
    key: 'dot',
    value: function dot(a) {
      return this.x * a.x + this.y * a.y + this.z * a.z;
    }

    /**
     * Compute the cross product for given point, and return it as a new FloatPoint3D.
     * @param {FloatPoint3D} point
     * @return {FloatPoint3D}
     */

  }, {
    key: 'cross',
    value: function cross(point) {
      var x = this.y * point.z - this.z * point.y;
      var y = this.z * point.x - this.x * point.z;
      var z = this.x * point.y - this.y * point.x;
      return new FloatPoint3D(x, y, z);
    }

    /**
     * @return {number}
     */

  }, {
    key: 'normSquared',
    value: function normSquared() {
      return this.dot(this);
    }

    /**
     * @return {number}
     */

  }, {
    key: 'norm',
    value: function norm() {
      return Math.sqrt(this.normSquared());
    }

    /**
     * @param {FloatPoint3D} a
     * @return {number}
     */

  }, {
    key: 'distanceTo',
    value: function distanceTo(a) {
      return this.sub(a).norm();
    }

    /**
     * @param {FloatPoint3D} a
     */

  }, {
    key: 'add',
    value: function add(a) {
      return new FloatPoint3D(this.x + a.x, this.y + a.y, this.z + a.z);
    }

    /**
     * @param {FloatPoint3D} a
     */

  }, {
    key: 'sub',
    value: function sub(a) {
      return new FloatPoint3D(this.x - a.x, this.y - a.y, this.z - a.z);
    }

    /**
     * @param {FloatPoint3D} a
     * @return {FloatPoint3D} - this * a
     */

  }, {
    key: 'mul',
    value: function mul(k) {
      return new FloatPoint3D(k * this.x, k * this.y, k * this.z);
    }

    /**
     * @param {FloatPoint3D} y
     * @return {number} - angle as radius.
     */

  }, {
    key: 'angleBetween',
    value: function angleBetween(y) {
      var xNorm = this.norm();
      var yNorm = y.norm();

      if (xNorm && yNorm) {
        var cosAngle = this.dot(y) / (xNorm * yNorm);
        return Math.acos(mathUtils.clampTo(cosAngle, -1.0, 1.0));
      }
      return 0;
    }

    /**
     * @return {Array<number>}
     */

  }, {
    key: 'toArray',
    value: function toArray() {
      return [this.x, this.y, this.z];
    }
  }]);

  return FloatPoint3D;
}();

module.exports = FloatPoint3D;