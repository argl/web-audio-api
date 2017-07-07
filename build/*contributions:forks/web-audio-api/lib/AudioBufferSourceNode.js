'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var constants = require('./constants'),
    AudioNode = require('./AudioNode'),
    AudioParam = require('./AudioParam'),
    AudioBuffer = require('./AudioBuffer'),
    readOnlyAttr = require('./utils').readOnlyAttr;

var AudioBufferSourceNode = function (_AudioNode) {
  _inherits(AudioBufferSourceNode, _AudioNode);

  function AudioBufferSourceNode(context) {
    _classCallCheck(this, AudioBufferSourceNode);

    var _this = _possibleConstructorReturn(this, (AudioBufferSourceNode.__proto__ || Object.getPrototypeOf(AudioBufferSourceNode)).call(this, context, 0, 1, undefined, 'max', 'speakers'));

    _this.buffer = null;
    _this.loop = false;
    _this.loopStart = 0;
    _this.loopEnd = 0;

    readOnlyAttr(_this, 'playbackRate', new AudioParam(_this.context, 1, 'a'));

    _this._dsp = _this._dspZeros;
    return _this;
  }

  _createClass(AudioBufferSourceNode, [{
    key: 'start',
    value: function start(when, offset, duration) {
      var _this2 = this;

      this._schedule('start', when, function () {
        if (!_this2.buffer) throw new Error('invalid buffer');

        // Subsequent calls to `start` have no effect
        _this2.start = function () {};

        // keeps track of the current position in the buffer
        var blockSize = constants.BLOCK_SIZE,
            sampleRate = _this2.context.sampleRate,
            cursor,
            cursorEnd,
            cursorNext,
            missingFrames,
            outBuffer;

        var reinitPlayback = function reinitPlayback() {
          cursor = (offset ? offset : _this2.loopStart) * sampleRate;
          if (duration) cursorEnd = cursor + duration * sampleRate;else if (_this2.loopEnd) cursorEnd = _this2.loopEnd * sampleRate;else cursorEnd = _this2.buffer.length;
          cursorNext = cursor;
        };
        reinitPlayback();

        _this2._dsp = function () {
          cursorNext = cursor + blockSize;
          // If there's enough data left to be read in the buffer, just read it,
          // otherwise we need to handle things a bit differently
          if (cursorNext < cursorEnd) {
            outBuffer = this.buffer.slice(cursor, cursorNext);
            cursor = cursorNext;
            return outBuffer;
          } else {
            outBuffer = new AudioBuffer(this.buffer.numberOfChannels, blockSize, this.buffer.sampleRate);
            outBuffer.set(this.buffer.slice(cursor, cursorNext));
            // If looping, we must reinitialize our cursor variables.
            // If not looping, we free the node
            if (this.loop) {
              missingFrames = cursorNext - cursorEnd;
              reinitPlayback();
              cursorNext = cursor + missingFrames;
              outBuffer.set(this.buffer.slice(cursor, cursorNext), outBuffer.length - missingFrames);
            } else {
              if (this.onended) {
                this._schedule('onended', this.context.currentTime + (cursorNext - cursorEnd) / sampleRate, this.onended);
              }
              this._schedule('kill', this.context.currentTime + (cursorNext - cursorEnd) / sampleRate, this._kill.bind(this));
            }
            cursor = cursorNext;
            return outBuffer;
          }
        };
      });
    }
  }, {
    key: 'stop',
    value: function stop(when) {
      var _this3 = this;

      this._schedule('stop', when, function () {
        _this3._dsp = _this3._dspZeros;
      });
    }
  }, {
    key: 'onended',
    value: function onended() {}
  }, {
    key: '_tick',
    value: function _tick() {
      _get(AudioBufferSourceNode.prototype.__proto__ || Object.getPrototypeOf(AudioBufferSourceNode.prototype), '_tick', this).call(this, arguments);
      return this._dsp();
    }
  }, {
    key: '_dsp',
    value: function _dsp() {}
  }, {
    key: '_dspZeros',
    value: function _dspZeros() {
      return new AudioBuffer(1, constants.BLOCK_SIZE, this.context.sampleRate);
    }
  }]);

  return AudioBufferSourceNode;
}(AudioNode);

module.exports = AudioBufferSourceNode;