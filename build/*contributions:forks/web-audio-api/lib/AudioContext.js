'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('underscore'),
    events = require('events'),
    async = require('async'),
    pcmUtils = require('pcm-boilerplate'),
    utils = require('./utils'),
    constants = require('./constants'),
    BLOCK_SIZE = constants.BLOCK_SIZE,
    AudioBuffer = require('./AudioBuffer'),
    AudioListener = require('./AudioListener'),
    AudioDestinationNode = require('./AudioDestinationNode'),
    AudioBufferSourceNode = require('./AudioBufferSourceNode'),
    GainNode = require('./GainNode'),
    ScriptProcessorNode = require('./ScriptProcessorNode'),
    PannerNode = require('./PannerNode');

var AudioContext = function (_events$EventEmitter) {
  _inherits(AudioContext, _events$EventEmitter);

  function AudioContext(opts) {
    _classCallCheck(this, AudioContext);

    var _this = _possibleConstructorReturn(this, (AudioContext.__proto__ || Object.getPrototypeOf(AudioContext)).call(this));

    var outBuff;

    /*Object.defineProperty(this, 'currentTime', {
    writable: false,
    get: function() {}
    })*/

    Object.defineProperty(_this, 'destination', {
      writable: false,
      value: new AudioDestinationNode(_this)
    });
    //this.destination = new AudioDestinationNode(this)

    // TODO
    // Object.defineProperty(this, 'sampleRate', {
    //   writable: false,
    //   value: {}
    // })

    Object.defineProperty(_this, 'listener', {
      writable: false,
      value: new AudioListener()
    });

    _this.currentTime = 0;
    _this.sampleRate = 44100;
    _this.numberOfChannels = 2;
    _this.bitDepth = 16;

    _this.format = {
      numberOfChannels: 2,
      bitDepth: 16,
      sampleRate: _this.sampleRate
    };

    opts = opts || {};
    if (opts.bufferSize) _this.format.bufferSize = opts.bufferSize;
    if (opts.numBuffers) _this.format.numBuffers = opts.numBuffers;

    _this.outStream = null;
    _this._encoder = pcmUtils.BufferEncoder(_this.format);
    _this._frame = 0;
    _this._playing = true;
    _this._audioOutLoopRunning = false;

    // When a new connection is established, start to pull audio
    _this.destination._inputs[0].on('connection', function () {
      if (_this._audioOutLoopRunning) return;
      if (!_this.outStream) throw new Error('you need to set outStream to send the audio somewhere');
      _this._audioOutLoopRunning = true;
      async.whilst(function () {
        return _this._playing;
      }, function (next) {
        outBuff = _this.destination._tick();
        // If there is space in the output stream's buffers, we write,
        // otherwise we wait for 'drain'
        _this._frame += BLOCK_SIZE;
        _this.currentTime = _this._frame * 1 / _this.sampleRate;
        // TODO setImmediate here is for cases where the outStream won't get
        // full and we end up with call stack max size reached.
        // But is it optimal?
        if (_this.outStream.write(_this._encoder(outBuff._data))) setImmediate(next);else _this.outStream.once('drain', next);
      }, function (err) {
        _this._audioOutLoopRunning = false;
        if (err) return _this.emit('error', err);
      });
    });
    return _this;
  }

  _createClass(AudioContext, [{
    key: 'createBuffer',
    value: function createBuffer(numberOfChannels, length, sampleRate) {
      return new AudioBuffer(numberOfChannels, length, sampleRate);
    }
  }, {
    key: 'decodeAudioData',
    value: function decodeAudioData(audioData, successCallback, errorCallback) {
      utils.decodeAudioData(audioData, function (err, audioBuffer) {
        if (err) errorCallback(err);else successCallback(audioBuffer);
      });
    }
  }, {
    key: 'createBufferSource',
    value: function createBufferSource() {
      return new AudioBufferSourceNode(this);
    }
  }, {
    key: 'createGain',
    value: function createGain() {
      return new GainNode(this);
    }
  }, {
    key: 'createScriptProcessor',
    value: function createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels) {
      return new ScriptProcessorNode(this, bufferSize, numberOfInputChannels, numberOfOutputChannels);
    }
  }, {
    key: 'createPanner',
    value: function createPanner() {
      return new PannerNode(this);
    }

    /*
    {
       readonly attribute AudioDestinationNode destination
      readonly attribute float sampleRate
      readonly attribute double currentTime
      readonly attribute AudioListener listener
       // AudioNode creation
      MediaElementAudioSourceNode createMediaElementSource(HTMLMediaElement mediaElement)
       MediaStreamAudioSourceNode createMediaStreamSource(MediaStream mediaStream)
      MediaStreamAudioDestinationNode createMediaStreamDestination()
       AnalyserNode createAnalyser()
      DelayNode createDelay(optional double maxDelayTime = 1.0)
      BiquadFilterNode createBiquadFilter()
      WaveShaperNode createWaveShaper()
      PannerNode createPanner()
      ConvolverNode createConvolver()
       ChannelSplitterNode createChannelSplitter(optional unsigned long numberOfOutputs = 6)
      ChannelMergerNode createChannelMerger(optional unsigned long numberOfInputs = 6)
       DynamicsCompressorNode createDynamicsCompressor()
       OscillatorNode createOscillator()
      PeriodicWave createPeriodicWave(Float32Array real, Float32Array imag)
    }
    */

  }, {
    key: '_kill',
    value: function _kill() {
      this._playing = false;
      if (this.outStream) {
        if (this.outStream.close) {
          this.outStream.close();
        } else {
          this.outStream.end();
        }
      }
    }
  }, {
    key: 'collectNodes',
    value: function collectNodes(node, allNodes) {
      var _this2 = this;

      allNodes = allNodes || [];
      node = node || this.destination;
      _.chain(node._inputs).pluck('sources').reduce(function (all, sources) {
        return all.concat(sources);
      }, []).pluck('node').value().forEach(function (upstreamNode) {
        if (!_.contains(allNodes, upstreamNode)) {
          allNodes.push(upstreamNode);
          _this2.collectNodes(upstreamNode, allNodes);
        }
      });
      return allNodes;
    }
  }]);

  return AudioContext;
}(events.EventEmitter);

module.exports = AudioContext;