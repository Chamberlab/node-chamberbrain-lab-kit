'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _nanotimer = require('nanotimer');

var _nanotimer2 = _interopRequireDefault(_nanotimer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Scheduler = function () {
  function Scheduler() {
    (0, _classCallCheck3.default)(this, Scheduler);

    this._timer = new _nanotimer2.default();
  }

  (0, _createClass3.default)(Scheduler, [{
    key: 'interval',
    value: function interval(timeStr, func) {
      var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
      var cb = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;

      this._timer.clearInterval();
      this._timer.setInterval(func, args || '', timeStr, cb);
    }
  }, {
    key: 'delay',
    value: function delay(timeStr, func) {
      var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
      var cb = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;

      this._timer.clearTimeout();
      this._timer.setTimeout(func, args || '', timeStr, cb);
    }
  }, {
    key: 'duration',
    value: function duration(func) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      // Returns microseconds; 'm' for milliseconds
      return this._timer.time(func, !args.length ? '' : args, 'u');
    }
  }]);
  return Scheduler;
}();

exports.default = Scheduler;