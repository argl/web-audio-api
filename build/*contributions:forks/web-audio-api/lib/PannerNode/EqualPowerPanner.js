'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Panner = require('./Panner'),
    mathUtils = require('../mathUtils');

// Use a 50ms smoothing / de-zippering time-constant.
var SmoothingTimeConstant = 0.050;

/**
 * @param {number} timeConstant
 * @param {number} sampleRate
 * @return {number}
 */
var discreteTimeConstantForSampleRate = function discreteTimeConstantForSampleRate(timeConstant, sampleRate) {
  return 1 - Math.exp(-1 / (sampleRate * timeConstant));
};

/**
 * Computes gains for PanningModel "equalpower".
 * Many codes are from chromium's Web Audio API implementation.
 https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/platform/geometry/FloatPoint3D.h
 */

var EqualPowerPanner = function (_Panner) {
  _inherits(EqualPowerPanner, _Panner);

  /**
   * @param {number} sampleRate
   */
  function EqualPowerPanner(sampleRate) {
    _classCallCheck(this, EqualPowerPanner);

    var _this = _possibleConstructorReturn(this, (EqualPowerPanner.__proto__ || Object.getPrototypeOf(EqualPowerPanner)).call(this));

    _this._isFirstRender = true;
    _this._gainL = 0;
    _this._gainR = 0;
    _this._smoothingConstant = discreteTimeConstantForSampleRate(SmoothingTimeConstant, sampleRate);
    return _this;
  }

  _createClass(EqualPowerPanner, [{
    key: 'reset',
    value: function reset() {
      this._isFirstRender = true;
    }

    /**
     * Compute output gains from azimuth and elevaion,
     * then apply them to inputBus and save to outputBus.
     * @param {number} azimuth
     * @param {number} elevation
     * @param {AudioBuffer} inputBus
     * @param {AudioBuffer} outputBus
     * @param {number} framesToProcess
     */

  }, {
    key: 'pan',
    value: function pan(azimuth, elevation, inputBus, outputBus, framesToProcess) {
      var isInputSafe = inputBus && (inputBus.numberOfChannels === 1 || inputBus.numberOfChannels === 2) && framesToProcess <= inputBus.length;
      if (!isInputSafe) {
        return;
      }

      var numberOfInputChannels = inputBus.numberOfChannels;

      var isOutputSafe = outputBus && outputBus.numberOfChannels === 2 && framesToProcess <= outputBus.length;
      if (!isOutputSafe) {
        return;
      }

      var sourceL = inputBus.getChannelData(0);
      var sourceR = numberOfInputChannels > 1 ? inputBus.getChannelData(1) : sourceL;
      var destinationL = outputBus.getChannelData(0);
      var destinationR = outputBus.getChannelData(1);

      if (!sourceL || !sourceR || !destinationL || !destinationR) {
        return;
      }

      // Clamp azimuth to allowed range of -180 -> +180.
      azimuth = mathUtils.clampTo(azimuth, -180.0, 180.0);

      // Alias the azimuth ranges behind us to in front of us:
      // -90 -> -180 to -90 -> 0 and 90 -> 180 to 90 -> 0
      if (azimuth < -90) {
        azimuth = -180 - azimuth;
      } else if (azimuth > 90) {
        azimuth = 180 - azimuth;
      }

      var desiredPanPosition = void 0;

      if (numberOfInputChannels === 1) {
        // For mono source case.
        // Pan smoothly from left to right with azimuth going from -90 -> +90 degrees.
        desiredPanPosition = (azimuth + 90) / 180;
      } else {
        // For stereo source case.
        if (azimuth <= 0) {
          // from -90 -> 0
          // sourceL -> destL and "equal-power pan" sourceR as in mono case
          // by transforming the "azimuth" value from -90 -> 0 degrees into the range -90 -> +90.
          desiredPanPosition = (azimuth + 90) / 90;
        } else {
          // from 0 -> +90
          // sourceR -> destR and "equal-power pan" sourceL as in mono case
          // by transforming the "azimuth" value from 0 -> +90 degrees into the range -90 -> +90.
          desiredPanPosition = azimuth / 90;
        }
      }

      var desiredPanRadius = Math.PI / 2 * desiredPanPosition;
      var desiredGainL = Math.cos(desiredPanRadius);
      var desiredGainR = Math.sin(desiredPanRadius);

      // Don't de-zipper on first render call.
      if (this._isFirstRender) {
        this._isFirstRender = false;
        this._gainL = desiredGainL;
        this._gainR = desiredGainR;
      }

      // Cache in local variables.
      var gainL = this._gainL;
      var gainR = this._gainR;

      // Get local copy of smoothing constant.
      var SmoothingConstant = this._smoothingConstant;

      var n = framesToProcess;

      if (numberOfInputChannels === 1) {
        // For mono source case.
        for (var i = 0; i < n; i++) {
          var inputL = sourceL[i];
          gainL += (desiredGainL - gainL) * SmoothingConstant;
          gainR += (desiredGainR - gainR) * SmoothingConstant;
          destinationL[i] = inputL * gainL;
          destinationR[i] = inputL * gainR;
        }
      } else {
        // For stereo source case.
        if (azimuth <= 0) {
          // from -90 -> 0
          for (var _i = 0; _i < n; _i++) {
            var _inputL = sourceL[_i];
            var inputR = sourceR[_i];
            gainL += (desiredGainL - gainL) * SmoothingConstant;
            gainR += (desiredGainR - gainR) * SmoothingConstant;
            destinationL[_i] = _inputL + inputR * gainL;
            destinationR[_i] = inputR * gainR;
          }
        } else {
          // from 0 -> +90
          for (var _i2 = 0; _i2 < n; _i2++) {
            var _inputL2 = sourceL[_i2];
            var _inputR = sourceR[_i2];
            gainL += (desiredGainL - gainL) * SmoothingConstant;
            gainR += (desiredGainR - gainR) * SmoothingConstant;
            destinationL[_i2] = _inputL2 * gainL;
            destinationR[_i2] = _inputR + _inputL2 * gainR;
          }
        }
      }

      this._gainL = gainL;
      this._gainR = gainR;
    }
  }]);

  return EqualPowerPanner;
}(Panner);

module.exports = EqualPowerPanner;