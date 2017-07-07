'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EqualPowerPanner = require('./EqualPowerPanner');

var PanningModelType = {
  equalpower: 'equalpower',
  HRTF: 'HRTF'

  /**
   * Provides pannignModel accessors and Panner instances.
   */
};
var PannerProvider = function () {

  /**
   * @param {AudioContext} context
   */
  function PannerProvider(context) {
    _classCallCheck(this, PannerProvider);

    this._context = context;
    this._panningModel = 'equalpower';
    this._panner = this.create(this._panningModel, this._context.sampleRate);
  }

  _createClass(PannerProvider, [{
    key: 'create',


    /**
     * @param {PanningModelType} model
     * @param {number} sampleRate
     * @return {Panner}
     */
    value: function create(model, sampleRate) {
      switch (model) {
        case PanningModelType.equalpower:
          return new EqualPowerPanner(sampleRate);
        case PanningModelType.HRTF:
          throw new TypeError('HRTF panner is not implemented');
        default:
          throw new TypeError('Invalid panner model');
      }
    }
  }, {
    key: 'panningModel',
    get: function get() {
      return this._panningModel;
    },
    set: function set(panningModel) {
      if (!PanningModelType[panningModel]) {
        throw new TypeError('Invalid panningModel');
      }
      this._panningModel = panningModel;
      this._panner = this.create(panningModel);
    }
  }, {
    key: 'panner',
    get: function get() {
      return this._panner;
    }
  }]);

  return PannerProvider;
}();

module.exports = PannerProvider;