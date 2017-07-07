'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('underscore'),
    AudioNode = require('../AudioNode'),
    AudioBuffer = require('../AudioBuffer'),
    BLOCK_SIZE = require('../constants').BLOCK_SIZE,
    FloatPoint3D = require('../FloatPoint3D'),
    DistanceEffect = require('./DistanceEffect'),
    ConeEffect = require('./ConeEffect'),
    PannerProvider = require('./PannerProvider'),
    mathUtils = require('../mathUtils'),
    NotSupportedError = require('../NotSupportedError');

var ChannelCountMode = _.object(['max', 'clamped-max', 'explicit'].map(function (x) {
  return [x, x];
}));

var PannerNode = function (_AudioNode) {
  _inherits(PannerNode, _AudioNode);

  function PannerNode(context) {
    _classCallCheck(this, PannerNode);

    /**
     * @override
     */
    var _this = _possibleConstructorReturn(this, (PannerNode.__proto__ || Object.getPrototypeOf(PannerNode)).call(this, context, 1, 1, 2, 'clamped-max', 'speakers'));

    var channelCount = 2;
    Object.defineProperty(_this, 'channelCount', {
      get: function get() {
        return channelCount;
      },
      set: function set(val) {
        if (val !== 1 && val !== 2) {
          throw new NotSupportedError('The channelCount provided (' + val + ') is outside the range [1, 2].');
        }
        channelCount = val;
      }
    });

    /**
     * @override
     */
    var channelCountMode = 'clamped-max';
    Object.defineProperty(_this, 'channelCountMode', {
      get: function get() {
        return channelCountMode;
      },
      set: function set(val) {
        if (!ChannelCountMode[val]) {
          throw new TypeError('Invalid value for channelCountMode : ' + val);
        }
        if (val === ChannelCountMode.max) {
          throw new NotSupportedError('Panner: \'max\' is not allowed');
        }
        channelCountMode = val;
      }
    });

    /** @private */
    _this._listener = context.listener;

    /** @type {DistanceEffect} */
    _this._distanceEffect = new DistanceEffect();

    /** @type {DistanceModelType} */
    Object.defineProperty(_this, 'distanceModel', {
      get: function get() {
        return this._distanceEffect.model;
      },
      set: function set(val) {
        this._distanceEffect.setModel(val, true);
      }
    });

    /** @type {PannerProvider} */
    _this._pannerProvider = new PannerProvider(context);

    /** @type {PanningModelType} */
    Object.defineProperty(_this, 'panningModel', {
      get: function get() {
        return this._pannerProvider.panningModel;
      },
      set: function set(val) {
        this._pannerProvider.panningModel = val;
      }
    });

    /** @type {float} */
    Object.defineProperty(_this, 'refDistance', {
      get: function get() {
        return this._distanceEffect.refDistance;
      },
      set: function set(val) {
        this._distanceEffect.refDistance = val;
      }
    });

    /** @type {float} */
    Object.defineProperty(_this, 'maxDistance', {
      get: function get() {
        return this._distanceEffect._maxDistance;
      },
      set: function set(val) {
        this._distanceEffect.maxDistance = val;
      }
    });

    /** @type {float} */
    Object.defineProperty(_this, 'rolloffFactor', {
      get: function get() {
        return this._distanceEffect.rolloffFactor;
      },
      set: function set(val) {
        this._distanceEffect.rolloffFactor = val;
      }
    });

    /** @type {ConeEffect} */
    _this._coneEffect = new ConeEffect();

    /** @type {float} */
    Object.defineProperty(_this, 'coneInnerAngle', {
      get: function get() {
        return this._coneEffect.innerAngle;
      },
      set: function set(val) {
        this._coneEffect.innerAngle = val;
      }
    });

    /** @type {float} */
    Object.defineProperty(_this, 'coneOuterAngle', {
      get: function get() {
        return this._coneEffect.outerAngle;
      },
      set: function set(val) {
        this._coneEffect.outerAngle = val;
      }
    });

    /** @type {float} */
    Object.defineProperty(_this, 'coneOuterGain', {
      get: function get() {
        return this._coneEffect.outerGain;
      },
      set: function set(val) {
        this._coneEffect.outerGain = val;
      }
    });

    _this._orientation = new FloatPoint3D(1, 0, 0);
    _this._position = new FloatPoint3D(1, 0, 0);
    _this._velocity = new FloatPoint3D(1, 0, 0);

    // Remember gain in last `_tick` to dezipper.
    // -1 means it is the first time `_tick` run.
    _this._lastGain = -1;
    return _this;
  }

  /**
   * Describes which direction the audio source is pointing in the 3D cartesian coordinate space.
   * Depending on how directional the sound is (controlled by the cone attributes),
   * a sound pointing away from the listener can be very quiet or completely silent.
   * @param {float} x
   * @param {float} y
   * @param {float} z
   * @return {void}
   */


  _createClass(PannerNode, [{
    key: 'setOrientation',
    value: function setOrientation(x, y, z) {
      var args = [].slice.call(arguments);
      if (args.length !== 3) {
        throw new TypeError('Failed to execute \'setOrientation\' on \'PannerNode\' 3 arguments required, but only ' + args.length + ' present.');
      }
      if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))) {
        throw new TypeError('Failed to execute \'setOrientation\' on \'PannerNode\': The provided float value is non-finite.');
      }
      this._orientation = new FloatPoint3D(x, y, z);
    }

    /**
     * Sets the position of the audio source relative to the listener attribute.
     * A 3D cartesian coordinate system is used.
     * @param {float} x
     * @param {float} y
     * @param {float} z
     * @return {void}
     */

  }, {
    key: 'setPosition',
    value: function setPosition(x, y, z) {
      var args = [].slice.call(arguments);
      if (args.length !== 3) {
        throw new TypeError('Failed to execute \'setPosition\' on \'PannerNode\' 3 arguments required, but only ' + args.length + ' present.');
      }
      if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))) {
        throw new TypeError('Failed to execute \'setPosition\' on \'PannerNode\': The provided float value is non-finite.');
      }
      this._position = new FloatPoint3D(x, y, z);
    }

    /**
     * Sets the velocity vector of the audio source.
     * This vector controls both the direction of travel and the speed in 3D space.
     * This velocity relative to the listener's velocity is used to determine
     * how much doppler shift (pitch change) to apply.
     * The units used for this vector is meters / second and is independent
     * of the units used for position and orientation vectors.
     * @param {float} x
     * @param {float} y
     * @param {float} z
     * @return {void}
     */

  }, {
    key: 'setVelocity',
    value: function setVelocity(x, y, z) {
      var args = [].slice.call(arguments);
      if (args.length !== 3) {
        throw new TypeError('Failed to execute \'setVelocity\' on \'PannerNode\' 3 arguments required, but only ' + args.length + ' present.');
      }
      if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))) {
        throw new TypeError('Failed to execute \'setVelocity\' on \'PannerNode\': The provided float value is non-finite.');
      }
      this._velocity = new FloatPoint3D(x, y, z);
    }

    /**
     * Calculate azimuth, elevation between panner and listener.
     * @return {azimuth: float, elevation: float}
     */

  }, {
    key: '_calculateAzimuthElevation',
    value: function _calculateAzimuthElevation() {
      var azimuth = 0.0;

      // Calculate the source-listener vector
      var listenerPosition = this._listener.position;
      var sourceListener = this._position.sub(listenerPosition);
      sourceListener.normalize();

      if (sourceListener.isZero()) {
        return { azimuth: 0, elevation: 0 };
      }

      // Align axes
      var listenerFront = this._listener.orientation; // FloatPoint3D
      var listenerUp = this._listener.upVector; // FloatPoint3D
      var listenerRight = listenerFront.cross(listenerUp); // FloatPoint3D
      listenerRight.normalize();

      var listenerFrontNorm = listenerFront; // FloatPoint3D
      listenerFrontNorm.normalize();

      var up = listenerRight.cross(listenerFrontNorm); // FloatPoint3D

      var upProjection = sourceListener.dot(up); // float

      var projectedSource = sourceListener.sub(up.mul(upProjection)); // FloatPoint3D

      azimuth = mathUtils.rad2deg(projectedSource.angleBetween(listenerRight));
      azimuth = mathUtils.fixNANs(azimuth); // avoid illegal values

      // Source in front or behind the listener
      var frontBack = projectedSource.dot(listenerFrontNorm); // double
      if (frontBack < 0.0) {
        azimuth = 360.0 - azimuth;
      }

      // Make azimuth relative to "front" and not "right" listener vector
      if (azimuth >= 0.0 && azimuth <= 270.0) {
        azimuth = 90.0 - azimuth;
      } else {
        azimuth = 450.0 - azimuth;
      }

      // Elevation
      var elevation = 90 - mathUtils.rad2deg(sourceListener.angleBetween(up)); // double
      elevation = mathUtils.fixNANs(elevation); // avoid illegal values

      if (elevation > 90.0) {
        elevation = 180.0 - elevation;
      } else if (elevation < -90.0) {
        elevation = -180.0 - elevation;
      }

      return { azimuth: azimuth, elevation: elevation };
    }
  }, {
    key: '_calculateDistanceConeGain',
    value: function _calculateDistanceConeGain() {
      var listenerPosition = this._listener.position; // FloatPoint3D
      var listenerDistance = this._position.distanceTo(listenerPosition); // double

      var distanceGain = this._distanceEffect.gain(listenerDistance); // double
      var coneGain = this._coneEffect.gain(this._position, this._orientation, listenerPosition); // double

      return distanceGain * coneGain;
    }

    /**
     * Method for cache.
     */

  }, {
    key: '_azimuthElevation',
    value: function _azimuthElevation() {
      return this._calculateAzimuthElevation();
    }

    /**
     * Method for cache.
     */

  }, {
    key: '_distanceConeGain',
    value: function _distanceConeGain() {
      return this._calculateDistanceConeGain();
    }

    /**
     * Reset panner's gain cache for dezipper
     */

  }, {
    key: '_resetPanner',
    value: function _resetPanner() {
      this._pannerProvider.panner.reset();
    }

    /**
     * @override
     * @return {AudioBuffer}
     */

  }, {
    key: '_tick',
    value: function _tick() {
      _get(PannerNode.prototype.__proto__ || Object.getPrototypeOf(PannerNode.prototype), '_tick', this).call(this, arguments);

      // AudioBus* destination = output(0).bus();
      var outBuff = new AudioBuffer(2, BLOCK_SIZE, this.context.sampleRate);
      var outL = outBuff.getChannelData(0);
      var outR = outBuff.getChannelData(1);

      if (!this.panningModel) {
        for (var i = 0; i < BLOCK_SIZE; i++) {
          outL[i] = outR[i] = 0;
        }
        return outBuff;
      }

      var inBuff = this._inputs[0]._tick(); // AudioBuffer

      // Apply the panning effect.

      var _azimuthElevation2 = this._azimuthElevation(),
          azimuth = _azimuthElevation2.azimuth,
          elevation = _azimuthElevation2.elevation;

      this._pannerProvider.panner.pan(azimuth, elevation, inBuff, outBuff, BLOCK_SIZE);

      // Get the distance and cone gain.
      var totalGain = this._distanceConeGain(); // float

      // Snap to desired gain at the beginning.
      if (this._lastGain === -1.0) {
        this._lastGain = totalGain;
      }

      // Apply gain in-place with de-zippering.
      // outBuff.copyWithGainFrom(outBuff, this._lastGain, totalGain)
      for (var _i = 0; _i < BLOCK_SIZE; _i++) {
        outL[_i] *= totalGain;
        outR[_i] *= totalGain;
      }

      return outBuff;
    }
  }]);

  return PannerNode;
}(AudioNode);

module.exports = PannerNode;