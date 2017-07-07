'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AudioNode = require('./AudioNode'),
    AudioParam = require('./AudioParam'),
    AudioBuffer = require('./AudioBuffer'),
    BLOCK_SIZE = require('./constants').BLOCK_SIZE,
    readOnlyAttr = require('./utils').readOnlyAttr;

var GainNode = function (_AudioNode) {
  _inherits(GainNode, _AudioNode);

  function GainNode(context) {
    _classCallCheck(this, GainNode);

    var _this = _possibleConstructorReturn(this, (GainNode.__proto__ || Object.getPrototypeOf(GainNode)).call(this, context, 1, 1, undefined, 'max', 'speakers'));

    readOnlyAttr(_this, 'gain', new AudioParam(_this.context, 1, 'a'));
    return _this;
  }

  _createClass(GainNode, [{
    key: '_tick',
    value: function _tick() {
      var outBuff, inBuff, gainArray, i, ch, inChArray, outChArray;
      _get(GainNode.prototype.__proto__ || Object.getPrototypeOf(GainNode.prototype), '_tick', this).call(this, arguments);
      inBuff = this._inputs[0]._tick();
      gainArray = this.gain._tick().getChannelData(0);
      outBuff = new AudioBuffer(inBuff.numberOfChannels, BLOCK_SIZE, this.context.sampleRate);
      for (ch = 0; ch < inBuff.numberOfChannels; ch++) {
        inChArray = inBuff.getChannelData(ch);
        outChArray = outBuff.getChannelData(ch);
        for (i = 0; i < BLOCK_SIZE; i++) {
          outChArray[i] = inChArray[i] * gainArray[i];
        }
      }
      return outBuff;
    }
  }]);

  return GainNode;
}(AudioNode);

module.exports = GainNode;