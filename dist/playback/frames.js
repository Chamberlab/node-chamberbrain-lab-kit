'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _big = require('big.js');

var _big2 = _interopRequireDefault(_big);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Frames = function () {
  function Frames() {
    (0, _classCallCheck3.default)(this, Frames);

    this._data = undefined;
    this._count = undefined;
    this._fps = undefined;
    this._interval = {};
  }

  (0, _createClass3.default)(Frames, [{
    key: 'interpolate',
    value: function interpolate(data) {
      var _this = this;

      var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Frames.INTERPOLATE.MAX;

      _assert2.default.notEqual(typeof data === 'undefined' ? 'undefined' : (0, _typeof3.default)(data), 'undefined');
      _assert2.default.equal((0, _getPrototypeOf2.default)((0, _getPrototypeOf2.default)(data)).constructor.name, 'TypedArray');
      _assert2.default.equal((0, _getPrototypeOf2.default)((0, _getPrototypeOf2.default)(this._data)).constructor.name, 'TypedArray');
      _assert2.default.ok((0, _isInteger2.default)(mode));

      switch (mode) {
        case Frames.INTERPOLATE.MAX:
          data.forEach(function (val, i) {
            if (_this._data[i] && val > _this._data[i]) _this._data[i] = val;
          });
          break;
        case Frames.INTERPOLATE.MIN:
          data.forEach(function (val, i) {
            if (_this._data[i] && val < _this._data[i]) _this._data[i] = val;
          });
          break;
        case Frames.INTERPOLATE.AVG:
          data.forEach(function (val, i) {
            if (_this._data[i]) _this._data[i] += val;
          });
          this._count += 1;
          break;
        default:
          throw new Error('Unknown interpolation mode: ' + mode);
      }
    }
  }, {
    key: 'interval',
    get: function get() {
      return this._interval;
    }
  }, {
    key: 'fps',
    set: function set(val) {
      this._fps = (0, _big2.default)(val);
      this._interval = {
        micros: (0, _big2.default)(1000000).div(this._fps).round(0),
        millis: (0, _big2.default)(1000).div(this._fps).round(0)
      };
    }
  }, {
    key: 'data',
    get: function get() {
      var _this2 = this;

      if (this.count > 1) {
        this._data.forEach(function (val, i) {
          if (typeof _this2._data[i] === 'number') _this2._data[i] = (0, _big2.default)(_this2._data[i]).div(val);
        });
        this._count = 0;
      }
      return this._data;
    },
    set: function set(value) {
      _assert2.default.equal((0, _getPrototypeOf2.default)((0, _getPrototypeOf2.default)(value)).constructor.name, 'TypedArray');
      this._data = value;
      this._count = 1;
    }
  }, {
    key: 'count',
    get: function get() {
      return this._count;
    },
    set: function set(value) {
      /* ignored */
    }
  }], [{
    key: 'INTERPOLATE',
    get: function get() {
      return {
        MAX: 0,
        MIN: 0,
        AVG: 0
      };
    }
  }]);
  return Frames;
}();

exports.default = Frames;