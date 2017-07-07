'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DistanceModelType = {
  inverse: 'inverse',
  linear: 'linear',
  exponential: 'exponential'

  /**
   * Computes distance effect gain and manages related properties.
   */
};
var DistanceEffect = function () {
  function DistanceEffect() {
    _classCallCheck(this, DistanceEffect);

    this._model = DistanceModelType.inverse;
    this._isClamped = true;
    this._refDistance = 1.0;
    this._maxDistance = 10000.0;
    this._rolloffFactor = 1.0;
  }

  _createClass(DistanceEffect, [{
    key: 'setModel',


    /**
     * @param {DistanceModelType} model
     * @param {boolean} clampled
     */
    value: function setModel(model, clamped) {
      if (!DistanceModelType[model]) {
        throw new Error('Invalid DistanceModelType');
      }
      this._model = model;
      this._isClamped = clamped;
    }
  }, {
    key: 'gain',


    /**
     * @param {number}
     * @return {number}
     */
    value: function gain(distance) {
      // don't go beyond maximum distance
      distance = Math.min(distance, this._maxDistance);

      // if clamped, don't get closer than reference distance
      if (this._isClamped) {
        distance = Math.max(distance, this._refDistance);
      }

      switch (this._model) {
        case DistanceModelType.linear:
          return this.linearGain(distance);
        case DistanceModelType.inverse:
          return this.inverseGain(distance);
        case DistanceModelType.exponential:
          return this.exponentialGain(distance);
        default:
          throw new TypeError('Invalid distance model', this._model);
      }
    }

    /**
     * @param {number}
     * @return {number}
     */

  }, {
    key: 'linearGain',
    value: function linearGain(distance) {
      return 1.0 - this._rolloffFactor * (distance - this._refDistance) / (this._maxDistance - this._refDistance);
    }

    /**
     * @param {number}
     * @return {number}
     */

  }, {
    key: 'inverseGain',
    value: function inverseGain(distance) {
      return this._refDistance / (this._refDistance + this._rolloffFactor * (distance - this._refDistance));
    }

    /**
     * @param {number}
     * @return {number}
     */

  }, {
    key: 'exponentialGain',
    value: function exponentialGain(distance) {
      return Math.pow(distance / this._refDistance, -this._rolloffFactor);
    }
  }, {
    key: 'model',
    get: function get() {
      return this._model;
    }
  }, {
    key: 'refDistance',
    get: function get() {
      return this._refDistance;
    },
    set: function set(refDistance) {
      if (!Number.isFinite(refDistance)) {
        throw new Error('Invalid refDistance');
      }
      this._refDistance = refDistance;
    }
  }, {
    key: 'maxDistance',
    get: function get() {
      return this._maxDistance;
    },
    set: function set(maxDistance) {
      if (!Number.isFinite(maxDistance)) {
        throw new Error('Invalid maxDistance');
      }
      this._maxDistance = maxDistance;
    }
  }, {
    key: 'rolloffFactor',
    get: function get() {
      return this._rolloffFactor;
    },
    set: function set(rolloffFactor) {
      if (!Number.isFinite(rolloffFactor)) {
        throw new Error('Invalid rolloffFactor');
      }
      this._rolloffFactor = rolloffFactor;
    }
  }]);

  return DistanceEffect;
}();

module.exports = DistanceEffect;