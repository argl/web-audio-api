'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The abstract class to extend in EqualPowerPanner, HRTFPanner(not implemented).
 */
var Panner = function () {
  function Panner() {
    _classCallCheck(this, Panner);
  }

  _createClass(Panner, [{
    key: 'pan',


    /** @abstract */
    value: function pan() {
      throw new Error('Do not call Panner.prototype.pan manually.');
    }
  }]);

  return Panner;
}();

module.exports = Panner;