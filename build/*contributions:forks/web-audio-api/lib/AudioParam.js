'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DspObject = require('./DspObject'),
    AudioInput = require('./audioports').AudioInput,
    AudioBuffer = require('./AudioBuffer'),
    BLOCK_SIZE = require('./constants').BLOCK_SIZE;

var AudioParam = function (_DspObject) {
  _inherits(AudioParam, _DspObject);

  function AudioParam(context, defaultValue, rate) {
    _classCallCheck(this, AudioParam);

    var _this = _possibleConstructorReturn(this, (AudioParam.__proto__ || Object.getPrototypeOf(AudioParam)).call(this, context));

    if (typeof defaultValue !== 'number') throw new Error('defaultValue must be a number');

    rate = rate || 'k';
    if (rate !== 'a' && rate !== 'k') throw new Error('invalid rate, must be a or k');
    _this._rate = rate;

    Object.defineProperty(_this, 'defaultValue', {
      value: defaultValue,
      writable: false
    });

    _this._instrinsicValue = defaultValue;
    Object.defineProperty(_this, 'value', {
      get: function get() {
        return this._instrinsicValue;
      },
      set: function set(newVal) {
        this._instrinsicValue = newVal;
        this._toConstant();
        this._scheduled = [];
      }
    });

    _this._toConstant();

    // Using AudioNodes as inputs for AudioParam :
    // we have to set same channel attributes as for AudioNodes,
    // so the input knows how to do the mixing
    _this.channelInterpretation = 'discrete';
    _this.channelCount = 1;
    _this.channelCountMode = 'explicit';
    _this._input = new AudioInput(_this.context, _this, 0);
    return _this;
  }

  _createClass(AudioParam, [{
    key: 'setValueAtTime',
    value: function setValueAtTime(value, startTime) {
      var _this2 = this;

      this._schedule('SetValue', startTime, function () {
        _this2._instrinsicValue = value;
        _this2._nextEvent();
      });
    }
  }, {
    key: 'linearRampToValueAtTime',
    value: function linearRampToValueAtTime(value, endTime) {
      var _this3 = this;

      this._schedule('LinearRampToValue', endTime, function () {
        _this3._instrinsicValue = value;
        _this3._nextEvent();
      }, [value]);
      this._nextEvent();
    }
  }, {
    key: 'exponentialRampToValueAtTime',
    value: function exponentialRampToValueAtTime(value, endTime) {
      var _this4 = this;

      if (this._instrinsicValue <= 0 || value <= 0) throw new Error('cannot create exponential ramp with value <= 0');
      this._schedule('ExponentialRampToValue', endTime, function () {
        _this4._instrinsicValue = value;
        _this4._nextEvent();
      }, [value]);
      this._nextEvent();
    }
  }, {
    key: 'setTargetAtTime',
    value: function setTargetAtTime(target, startTime, timeConstant) {
      var _this5 = this;

      this._schedule('SetTarget', startTime, function () {
        _this5['_to_' + _this5._rate + 'Rate_setTarget'](target, timeConstant, function () {
          _this5._instrinsicValue = target;
          _this5._nextEvent();
        });
      });
    }
  }, {
    key: 'setValueCurveAtTime',
    value: function setValueCurveAtTime(values, startTime, duration) {
      var _this6 = this;

      this._schedule('SetValueCurve', startTime, function () {
        _this6['_to_' + _this6._rate + 'Rate_SetValueCurve'](values, startTime, duration, function () {
          _this6._instrinsicValue = values[values.length - 1];
          _this6._nextEvent();
        });
      });
    }
  }, {
    key: '_nextEvent',
    value: function _nextEvent() {
      var event = this._scheduled[0];
      if (event) {
        if (event.type === 'LinearRampToValue') this['_to_' + this._rate + 'Rate_linearRamp'](event.args[0], event.time);else if (event.type === 'ExponentialRampToValue') this['_to_' + this._rate + 'Rate_exponentialRamp'](event.args[0], event.time);else this._toConstant();
      } else this._toConstant();
    }
  }, {
    key: '_tick',
    value: function _tick() {
      _get(AudioParam.prototype.__proto__ || Object.getPrototypeOf(AudioParam.prototype), '_tick', this).call(this);
      var buffer = new AudioBuffer(1, BLOCK_SIZE, this.context.sampleRate);
      this._dsp(buffer.getChannelData(0));
      return buffer;
    }

    // This method calculates intrinsic values

  }, {
    key: '_dsp',
    value: function _dsp() {}

    // -------------------- DSP methods -------------------- //

  }, {
    key: '_toConstant',
    value: function _toConstant() {
      var value = this._instrinsicValue,
          i;

      this._dsp = function (array) {
        for (i = 0; i < BLOCK_SIZE; i++) {
          array[i] = value;
        }
      };
    }
  }, {
    key: '_to_aRate_linearRamp',
    value: function _to_aRate_linearRamp(target, endTime) {
      var U0 = this._instrinsicValue,
          Un = U0,
          startTime = this.context.currentTime,
          step = (target - U0) / (endTime - startTime) * 1 / this.context.sampleRate,
          next = this._arithmeticSeries(U0, step),
          clip = step > 0 ? Math.min : Math.max,
          i;

      this._dsp = function (array) {
        for (i = 0; i < BLOCK_SIZE; i++) {
          array[i] = clip(Un, target);
          Un = next();
        }
        this._instrinsicValue = array[BLOCK_SIZE - 1];
      };
    }
  }, {
    key: '_to_kRate_linearRamp',
    value: function _to_kRate_linearRamp(target, endTime) {
      var U0 = this._instrinsicValue,
          Un = U0,
          startTime = this.context.currentTime,
          step = (target - U0) / (endTime - startTime) * BLOCK_SIZE / this.context.sampleRate,
          next = this._arithmeticSeries(U0, step),
          i;

      this._dsp = function (array) {
        for (i = 0; i < BLOCK_SIZE; i++) {
          array[i] = Un;
        }Un = next();
        this._instrinsicValue = array[BLOCK_SIZE - 1];
      };
    }
  }, {
    key: '_to_aRate_exponentialRamp',
    value: function _to_aRate_exponentialRamp(target, timeEnd) {
      var timeStart = this.context.currentTime,
          U0 = this._instrinsicValue,
          Un = U0,
          ratio = Math.pow(target / U0, 1 / (this.context.sampleRate * (timeEnd - timeStart))),
          next = this._geometricSeries(U0, ratio),
          clip = ratio > 1 ? Math.min : Math.max,
          i;

      this._dsp = function (array) {
        for (i = 0; i < BLOCK_SIZE; i++) {
          array[i] = clip(target, Un);
          Un = next();
        }
        this._instrinsicValue = array[BLOCK_SIZE - 1];
      };
    }
  }, {
    key: '_to_kRate_exponentialRamp',
    value: function _to_kRate_exponentialRamp(target, timeEnd) {
      var timeStart = this.context.currentTime,
          U0 = this._instrinsicValue,
          Un = U0,
          ratio = Math.pow(target / U0, BLOCK_SIZE / (this.context.sampleRate * (timeEnd - timeStart))),
          next = this._geometricSeries(U0, ratio),
          i;

      this._dsp = function (array) {
        for (i = 0; i < BLOCK_SIZE; i++) {
          array[i] = Un;
        }Un = next();
        this._instrinsicValue = array[BLOCK_SIZE - 1];
      };
    }
  }, {
    key: '_to_aRate_setTarget',
    value: function _to_aRate_setTarget(target, Tc, onended) {
      var timeStart = this.context.currentTime,
          U0 = this._instrinsicValue - target,
          Un = target + U0,
          ratio = Math.exp(-(1 / this.context.sampleRate) / Tc),
          next = this._geometricSeries(U0, ratio),
          clip = U0 > 0 ? Math.max : Math.min,
          i;

      this._dsp = function (array) {
        for (i = 0; i < BLOCK_SIZE; i++) {
          array[i] = clip(Un, target);
          Un = target + next();
        }
        this._instrinsicValue = array[BLOCK_SIZE - 1];
        if (array[BLOCK_SIZE - 1] === target) onended();
      };
    }
  }, {
    key: '_to_kRate_setTarget',
    value: function _to_kRate_setTarget(target, Tc, onended) {
      var timeStart = this.context.currentTime,
          U0 = this._instrinsicValue - target,
          Un = target + U0,
          ratio = Math.exp(-(BLOCK_SIZE / this.context.sampleRate) / Tc),
          next = this._geometricSeries(U0, ratio),
          i;

      this._dsp = function (array) {
        for (i = 0; i < BLOCK_SIZE; i++) {
          array[i] = Un;
        }Un = target + next();
        this._instrinsicValue = array[BLOCK_SIZE - 1];
      };
    }
  }, {
    key: '_to_aRate_SetValueCurve',
    value: function _to_aRate_SetValueCurve(values, startTime, duration, onended) {
      var valuesLength = values.length,
          coeff = valuesLength / duration,
          Ts = 1 / this.context.sampleRate,
          i,
          t;

      this._dsp = function (array) {
        t = this.context.currentTime;
        for (i = 0; i < BLOCK_SIZE; i++) {
          array[i] = values[Math.min(Math.round(coeff * (t - startTime)), valuesLength - 1)];
          t += Ts;
        }
        this._instrinsicValue = array[BLOCK_SIZE - 1];
        if (t - startTime >= duration) onended();
      };
    }
  }, {
    key: '_to_kRate_SetValueCurve',
    value: function _to_kRate_SetValueCurve(values, startTime, duration, onended) {
      var valuesLength = values.length,
          coeff = valuesLength / duration,
          Ts = 1 / this.context.sampleRate,
          i,
          val;

      this._dsp = function (array) {
        val = values[Math.min(Math.round(coeff * (this.context.currentTime - startTime)), valuesLength - 1)];
        for (i = 0; i < BLOCK_SIZE; i++) {
          array[i] = val;
        }this._instrinsicValue = array[BLOCK_SIZE - 1];
      };
    }
  }, {
    key: '_geometricSeries',
    value: function _geometricSeries(U0, ratio) {
      var Un = U0;
      return function () {
        return Un *= ratio;
      };
    }
  }, {
    key: '_arithmeticSeries',
    value: function _arithmeticSeries(U0, step) {
      var Un = U0;
      return function () {
        return Un += step;
      };
    }
  }, {
    key: 'cancelScheduledValues',
    value: function cancelScheduledValues(startTime) {
      throw new Error('implement me');
    }
  }]);

  return AudioParam;
}(DspObject);

module.exports = AudioParam;