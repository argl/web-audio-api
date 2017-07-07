'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('underscore'),
    BLOCK_SIZE = require('./constants').BLOCK_SIZE,
    AudioNode = require('./AudioNode'),
    AudioBuffer = require('./AudioBuffer'),
    readOnlyAttr = require('./utils').readOnlyAttr;

var ScriptProcessorNode = function (_AudioNode) {
  _inherits(ScriptProcessorNode, _AudioNode);

  function ScriptProcessorNode(context, bufferSize, numberOfInputChannels, numberOfOutputChannels) {
    _classCallCheck(this, ScriptProcessorNode);

    if (!_.contains([256, 512, 1024, 2048, 4096, 8192, 16384], bufferSize)) throw new Error('invalid bufferSize');

    var _this = _possibleConstructorReturn(this, (ScriptProcessorNode.__proto__ || Object.getPrototypeOf(ScriptProcessorNode)).call(this, context, 1, 1, numberOfInputChannels, 'explicit', 'speakers'));

    _this.numberOfOutputChannels = numberOfOutputChannels;
    readOnlyAttr(_this, 'bufferSize', bufferSize);
    return _this;
  }

  _createClass(ScriptProcessorNode, [{
    key: '_processingEvent',
    value: function _processingEvent(inBuffer) {
      return new AudioProcessingEvent(this.context.currentTime, inBuffer, new AudioBuffer(this.numberOfOutputChannels, this.bufferSize, this.context.sampleRate));
    }
  }, {
    key: '_tick',
    value: function _tick() {
      _get(ScriptProcessorNode.prototype.__proto__ || Object.getPrototypeOf(ScriptProcessorNode.prototype), '_tick', this).call(this, arguments);
      return new AudioBuffer(this.numberOfOutputChannels, BLOCK_SIZE, this.context.sampleRate);
    }
  }, {
    key: 'onaudioprocess',
    set: function set(onaudioprocess) {

      var inputBuffer = new AudioBuffer(this.channelCount, 0, this.context.sampleRate),
          outputBuffer = new AudioBuffer(this.numberOfOutputChannels, 0, this.context.sampleRate);

      this._tick = function () {
        AudioNode.prototype._tick.apply(this, arguments);

        // Pull some data and add it to `inputBuffer`
        inputBuffer = inputBuffer.concat(this._inputs[0]._tick());

        // When enough data in `inputBuffer`, we run `onaudioprocess`
        if (inputBuffer.length === this.bufferSize) {
          var audioProcEvent = this._processingEvent(inputBuffer);
          onaudioprocess(audioProcEvent);
          inputBuffer = new AudioBuffer(this.channelCount, 0, this.context.sampleRate);
          outputBuffer = outputBuffer.concat(audioProcEvent.outputBuffer);
        } else if (inputBuffer.length >= this.bufferSize) throw new Error('this shouldnt happen');

        // When data has been processed, we return it
        if (outputBuffer.length >= BLOCK_SIZE) {
          var returnedBuffer = outputBuffer.slice(0, BLOCK_SIZE);
          outputBuffer = outputBuffer.slice(BLOCK_SIZE);
          return returnedBuffer;
        } else return new AudioBuffer(this.numberOfOutputChannels, BLOCK_SIZE, this.context.sampleRate);
      };
    }
  }]);

  return ScriptProcessorNode;
}(AudioNode);

var AudioProcessingEvent = function AudioProcessingEvent(playbackTime, inputBuffer, outputBuffer) {
  _classCallCheck(this, AudioProcessingEvent);

  this.playbackTime = playbackTime;
  this.inputBuffer = inputBuffer;
  this.outputBuffer = outputBuffer;
};

module.exports = ScriptProcessorNode;