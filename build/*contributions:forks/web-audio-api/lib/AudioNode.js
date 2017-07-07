'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events').EventEmitter,
    async = require('async'),
    utils = require('./utils'),
    readOnlyAttr = utils.readOnlyAttr,
    DspObject = require('./DspObject'),
    AudioInput = require('./audioports').AudioInput,
    AudioOutput = require('./audioports').AudioOutput;

var ChannelCountMode = ['max', 'clamped-max', 'explicit'],
    ChannelInterpretation = ['speakers', 'discrete'];

var AudioNode = function (_DspObject) {
  _inherits(AudioNode, _DspObject);

  function AudioNode(context, numberOfInputs, numberOfOutputs, channelCount, channelCountMode, channelInterpretation) {
    _classCallCheck(this, AudioNode);

    var _this = _possibleConstructorReturn(this, (AudioNode.__proto__ || Object.getPrototypeOf(AudioNode)).call(this, context));

    readOnlyAttr(_this, 'context', context);
    readOnlyAttr(_this, 'numberOfInputs', numberOfInputs);
    readOnlyAttr(_this, 'numberOfOutputs', numberOfOutputs);

    channelCount = channelCount || 2;
    Object.defineProperty(_this, 'channelCount', {
      get: function get() {
        return channelCount;
      },
      set: function set(val) {
        if (val < 1) throw new Error('Invalid number of channels');
        channelCount = val;
      },
      configurable: true
    });

    var channelCountMode = channelCountMode;
    Object.defineProperty(_this, 'channelCountMode', {
      get: function get() {
        return channelCountMode;
      },
      set: function set(val) {
        if (ChannelCountMode.indexOf(val) === -1) throw new Error('Unvalid value for channelCountMode : ' + val);
        channelCountMode = val;
      },
      configurable: true
    });

    var channelInterpretation = channelInterpretation;
    Object.defineProperty(_this, 'channelInterpretation', {
      get: function get() {
        return channelInterpretation;
      },
      set: function set(val) {
        if (ChannelInterpretation.indexOf(val) === -1) throw new Error('Unvalid value for channelInterpretation : ' + val);
        channelInterpretation = val;
      },
      configurable: true
    });

    // Initialize audio ports
    var i;
    _this._inputs = [];
    _this._outputs = [];
    for (i = 0; i < _this.numberOfInputs; i++) {
      _this._inputs.push(new AudioInput(context, _this, i));
    }for (i = 0; i < _this.numberOfOutputs; i++) {
      _this._outputs.push(new AudioOutput(context, _this, i));
    }return _this;
  }

  _createClass(AudioNode, [{
    key: 'connect',
    value: function connect(destination) {
      var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var input = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      if (output >= this.numberOfOutputs) throw new Error('output out of bounds ' + output);
      if (input >= destination.numberOfInputs) throw new Error('input out of bounds ' + input);
      this._outputs[output].connect(destination._inputs[input]);
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      var output = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      if (output >= this.numberOfOutputs) throw new Error('output out of bounds ' + output);
      var audioOut = this._outputs[output];
      audioOut.sinks.slice(0).forEach(function (sink) {
        audioOut.disconnect(sink);
      });
    }

    // Disconnects all ports and remove all events listeners

  }, {
    key: '_kill',
    value: function _kill() {
      this._inputs.forEach(function (input) {
        input._kill();
      });
      this._outputs.forEach(function (output) {
        output._kill();
      });
      this.removeAllListeners();
      this._tick = function () {
        throw new Error('this node has been killed');
      };
    }
  }]);

  return AudioNode;
}(DspObject);

module.exports = AudioNode;