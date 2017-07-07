'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FloatPoint3D = require('./FloatPoint3D');

var AudioListener = function () {
  function AudioListener() {
    _classCallCheck(this, AudioListener);

    this._position = new FloatPoint3D(0, 0, 0);
    this._orientation = new FloatPoint3D(0, 0, -1);
    this._upVector = new FloatPoint3D(0, 1, 0);
    this._velocity = new FloatPoint3D(0, 0, 0);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */


  _createClass(AudioListener, [{
    key: 'setPosition',
    value: function setPosition(x, y, z) {
      this._position = new FloatPoint3D(x, y, z);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} xUp
     * @param {number} yUp
     * @param {number} zUp
     */

  }, {
    key: 'setOrientation',
    value: function setOrientation(x, y, z, xUp, yUp, zUp) {
      this._setOrientation(x, y, z);
      this._setUpVector(xUp, yUp, zUp);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */

  }, {
    key: '_setOrientation',
    value: function _setOrientation(x, y, z) {
      this._orientation = new FloatPoint3D(x, y, z);
    }

    /**
     * @param {number} xUp
     * @param {number} yUp
     * @param {number} zUp
     */

  }, {
    key: '_setUpVector',
    value: function _setUpVector(xUp, yUp, zUp) {
      this._upVector = new FloatPoint3D(xUp, yUp, zUp);
    }
  }, {
    key: 'position',
    get: function get() {
      return this._position;
    }
  }, {
    key: 'velocity',
    get: function get() {
      return this._velocity;
    }
  }, {
    key: 'upVector',
    get: function get() {
      return this._upVector;
    }
  }, {
    key: 'orientation',
    get: function get() {
      return this._orientation;
    }
  }]);

  return AudioListener;
}();

module.exports = AudioListener;