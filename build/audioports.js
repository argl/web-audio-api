'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('underscore'),
    async = require('async'),
    events = require('events'),
    utils = require('./utils'),
    AudioBuffer = require('./AudioBuffer'),
    BLOCK_SIZE = require('./constants').BLOCK_SIZE,
    ChannelMixing = require('./ChannelMixing');

var AudioPort = function (_events$EventEmitter) {
  _inherits(AudioPort, _events$EventEmitter);

  function AudioPort(context, node, id) {
    _classCallCheck(this, AudioPort);

    var _this = _possibleConstructorReturn(this, (AudioPort.__proto__ || Object.getPrototypeOf(AudioPort)).call(this));

    _this.connections = [];
    _this.node = node;
    _this.id = id;
    _this.context = context;
    return _this;
  }

  // Generic function for connecting the calling AudioPort
  // with `otherPort`. Returns true if a connection was indeed established


  _createClass(AudioPort, [{
    key: 'connect',
    value: function connect(otherPort) {
      if (this.connections.indexOf(otherPort) !== -1) return false;
      this.connections.push(otherPort);
      otherPort.connect(this);
      this.emit('connection', otherPort);
      return true;
    }

    // Generic function for disconnecting the calling AudioPort
    // from `otherPort`. Returns true if a disconnection was indeed made

  }, {
    key: 'disconnect',
    value: function disconnect(otherPort) {
      var connInd = this.connections.indexOf(otherPort);
      if (connInd === -1) return false;
      this.connections.splice(connInd, 1);
      otherPort.disconnect(this);
      this.emit('disconnection', otherPort);
      return true;
    }

    // Called when a node is killed. Removes connections, and event listeners.

  }, {
    key: '_kill',
    value: function _kill() {
      var _this2 = this;

      this.connections.slice(0).forEach(function (port) {
        _this2.disconnect(port);
      });
      this.removeAllListeners();
    }
  }]);

  return AudioPort;
}(events.EventEmitter);

var AudioInput = function (_AudioPort) {
  _inherits(AudioInput, _AudioPort);

  function AudioInput(context, node, id) {
    _classCallCheck(this, AudioInput);

    // `computedNumberOfChannels` is scheduled to be recalculated everytime a connection
    // or disconnection happens.
    var _this3 = _possibleConstructorReturn(this, (AudioInput.__proto__ || Object.getPrototypeOf(AudioInput)).call(this, context, node, id));

    _this3.computedNumberOfChannels = null;
    _this3.on('connected', function () {
      _this3.computedNumberOfChannels = null;
    });
    _this3.on('disconnected', function () {
      _this3.computedNumberOfChannels = null;
    });

    // Just for code clarity
    Object.defineProperty(_this3, 'sources', {
      get: function get() {
        return this.connections;
      }
    });
    return _this3;
  }

  _createClass(AudioInput, [{
    key: 'connect',
    value: function connect(source) {
      var _this4 = this;

      // When the number of channels of the source changes, we trigger
      // computation of `computedNumberOfChannels`
      source.on('_numberOfChannels', function () {
        _this4.computedNumberOfChannels = null;
      });
      //AudioPort.prototype.connect.call(this, source)
      _get(AudioInput.prototype.__proto__ || Object.getPrototypeOf(AudioInput.prototype), 'connect', this).call(this, source);
    }
  }, {
    key: 'disconnect',
    value: function disconnect(source) {
      source.removeAllListeners('_numberOfChannels');
      //AudioPort.prototype.disconnect.call(this, source)
      _get(AudioInput.prototype.__proto__ || Object.getPrototypeOf(AudioInput.prototype), 'disconnect', this).call(this, source);
    }
  }, {
    key: '_tick',
    value: function _tick() {
      var _this5 = this;

      var i,
          ch,
          inNumChannels,
          inBuffers = this.sources.map(function (source) {
        return source._tick();
      });

      if (this.computedNumberOfChannels === null) {
        var maxChannelsUpstream;
        if (this.sources.length) {
          maxChannelsUpstream = _.chain(inBuffers).pluck('numberOfChannels').max().value();
        } else maxChannelsUpstream = 0;
        this._computeNumberOfChannels(maxChannelsUpstream);
      }
      var outBuffer = new AudioBuffer(this.computedNumberOfChannels, BLOCK_SIZE, this.context.sampleRate);

      inBuffers.forEach(function (inBuffer) {
        var ch = new ChannelMixing(inBuffer.numberOfChannels, _this5.computedNumberOfChannels, _this5.node.channelInterpretation);
        ch.process(inBuffer, outBuffer);
      });
      return outBuffer;
    }
  }, {
    key: '_computeNumberOfChannels',
    value: function _computeNumberOfChannels(maxChannelsUpstream) {
      var countMode = this.node.channelCountMode,
          channelCount = this.node.channelCount;
      maxChannelsUpstream = maxChannelsUpstream || 1;

      if (countMode === 'max') {
        this.computedNumberOfChannels = maxChannelsUpstream;
      } else if (countMode === 'clamped-max') {
        this.computedNumberOfChannels = Math.min(maxChannelsUpstream, channelCount);
      } else if (countMode === 'explicit') this.computedNumberOfChannels = channelCount;
      // this shouldn't happen
      else throw new Error('invalid channelCountMode');
    }
  }]);

  return AudioInput;
}(AudioPort);

var AudioOutput = function (_AudioPort2) {
  _inherits(AudioOutput, _AudioPort2);

  function AudioOutput(context, node, id) {
    _classCallCheck(this, AudioOutput);

    // This caches the block fetched from the node.
    var _this6 = _possibleConstructorReturn(this, (AudioOutput.__proto__ || Object.getPrototypeOf(AudioOutput)).call(this, context, node, id));

    _this6._cachedBlock = {
      time: -1,
      buffer: null

      // This catches the number of channels of the audio going through this output
    };_this6._numberOfChannels = null;

    // Just for code clarity
    Object.defineProperty(_this6, 'sinks', {
      get: function get() {
        return this.connections;
      }
    });
    return _this6;
  }

  // Pulls the audio from the node only once, and copies it so that several
  // nodes downstream can pull the same block.


  _createClass(AudioOutput, [{
    key: '_tick',
    value: function _tick() {
      if (this._cachedBlock.time < this.context.currentTime) {
        var outBuffer = this.node._tick();
        if (this._numberOfChannels !== outBuffer.numberOfChannels) {
          this._numberOfChannels = outBuffer.numberOfChannels;
          this.emit('_numberOfChannels');
        }
        this._cachedBlock = {
          time: this.context.currentTime,
          buffer: outBuffer
        };
        return outBuffer;
      } else return this._cachedBlock.buffer;
    }
  }]);

  return AudioOutput;
}(AudioPort);

module.exports = {
  AudioOutput: AudioOutput,
  AudioInput: AudioInput
};