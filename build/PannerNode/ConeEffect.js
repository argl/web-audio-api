'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var mathUtils = require('../mathUtils'),
    InvalidStateError = require('../InvalidStateError');

/**
 * Computes cone effect gain and manages related properties.
 */

var ConeEffect = function () {
  function ConeEffect() {
    _classCallCheck(this, ConeEffect);

    this._innerAngle = 360;
    this._outerAngle = 360;
    this._outerGain = 0;
  }

  // Angles in degrees


  _createClass(ConeEffect, [{
    key: 'gain',


    /**
     * Returns scalar gain for the given source/listener positions/orientations
     * @param {FloatPoint3D} sourcePosition
     * @param {FloatPoint3D} sourceOrientation
     * @param {FloatPoint3D} listenerPosition
     * @return {number}
     */
    value: function gain(sourcePosition, sourceOrientation, listenerPosition) {
      if (sourceOrientation.isZero() || this._innerAngle === 360.0 && this._outerAngle === 360.0) {
        return 1.0; // no cone specified - unity gain
      }

      // Source-listener vector
      var sourceToListener = listenerPosition.sub(sourcePosition); // FloatPoint3D

      // Angle between the source orientation vector and the source-listener vector
      var angle = mathUtils.rad2deg(sourceToListener.angleBetween(sourceOrientation));
      var absAngle = Math.abs(angle); // double

      // Divide by 2.0 here since API is entire angle (not half-angle)
      var absInnerAngle = Math.abs(this._innerAngle) / 2.0;
      var absOuterAngle = Math.abs(this._outerAngle) / 2.0;
      var gain = 1.0;

      if (absAngle <= absInnerAngle) {
        gain = 1.0;
      } else if (absAngle >= absOuterAngle) {
        gain = this._outerGain;
      } else {
        var x = (absAngle - absInnerAngle) / (absOuterAngle - absInnerAngle);
        gain = 1.0 - x + this._outerGain * x;
      }

      return gain;
    }
  }, {
    key: 'innerAngle',
    get: function get() {
      return this._innerAngle;
    },
    set: function set(innerAngle) {
      if (!Number.isFinite(innerAngle)) {
        throw new TypeError('Invalid coneInnerAngle');
      }
      this._innerAngle = (innerAngle - 1) % 360 + 1;
    }
  }, {
    key: 'outerAngle',
    get: function get() {
      return this._outerAngle;
    },
    set: function set(outerAngle) {
      if (!Number.isFinite(outerAngle)) {
        throw new TypeError('Invalid coneOuterAngle');
      }
      this._outerAngle = (outerAngle - 1) % 360 + 1;
    }
  }, {
    key: 'outerGain',
    get: function get() {
      return this._outerGain;
    },
    set: function set(outerGain) {
      if (!Number.isFinite(outerGain)) {
        throw new TypeError('Invalid coneOuterGain');
      }
      if (outerGain < 0 || 1 < outerGain) {
        throw new InvalidStateError('Invalid coneOuterGain');
      }
      this._outerGain = outerGain;
    }
  }]);

  return ConeEffect;
}();

module.exports = ConeEffect;