'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('underscore'),
    events = require('events');

var DspObject = function (_events$EventEmitter) {
  _inherits(DspObject, _events$EventEmitter);

  function DspObject(context) {
    _classCallCheck(this, DspObject);

    var _this = _possibleConstructorReturn(this, (DspObject.__proto__ || Object.getPrototypeOf(DspObject)).call(this));

    _this.context = context;
    _this._scheduled = [];
    return _this;
  }

  _createClass(DspObject, [{
    key: '_tick',
    value: function _tick() {
      this._frame++;
      var event = this._scheduled.shift(),
          eventsSameTime,
          eventsToExecute = [],
          previousTime;

      // Gather all events that need to be executed at this tick
      while (event && event.time <= this.context.currentTime) {
        previousTime = event.time;
        eventsSameTime = [];
        // Gather all the events with same time
        while (event && event.time === previousTime) {
          // Add the event only if there isn't already events with same type
          if (eventsSameTime.every(function (other) {
            return event.type !== other.type;
          })) eventsSameTime.push(event);
          event = this._scheduled.shift();
        }
        eventsSameTime.forEach(function (event) {
          eventsToExecute.push(event);
        });
      }
      if (event) this._scheduled.unshift(event);

      // And execute
      eventsToExecute.reverse().forEach(function (event) {
        event.func && event.func();
      });
    }
  }, {
    key: '_schedule',
    value: function _schedule(type, time, func, args) {
      var event = {
        time: time,
        func: func,
        type: type
      },
          ind = _.sortedIndex(this._scheduled, event, function (e) {
        return e.time;
      });
      if (args) event.args = args;
      this._scheduled.splice(ind, 0, event);
    }
  }, {
    key: '_unscheduleTypes',
    value: function _unscheduleTypes(types) {
      this._scheduled = _.reject(this._scheduled, function (event) {
        return _.contains(types, event.type);
      });
    }
  }]);

  return DspObject;
}(events.EventEmitter);

module.exports = DspObject;