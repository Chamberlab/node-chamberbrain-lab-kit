'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

require('colors');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _microtime = require('microtime');

var _microtime2 = _interopRequireDefault(_microtime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Stats = function () {
  function Stats() {
    (0, _classCallCheck3.default)(this, Stats);

    this._entries = 0;
    this._errors = 0;
    this._start = (0, _moment2.default)();
    this._micros = 0;
  }

  (0, _createClass3.default)(Stats, [{
    key: 'addEntries',
    value: function addEntries() {
      var count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      _assert2.default.equal(typeof count === 'undefined' ? 'undefined' : (0, _typeof3.default)(count), 'number');
      this._entries += count;
    }
  }, {
    key: 'addErrors',
    value: function addErrors() {
      var count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      _assert2.default.equal(typeof count === 'undefined' ? 'undefined' : (0, _typeof3.default)(count), 'number');
      this.addEntries(count);
      this._errors += count;
    }
  }, {
    key: 'print',
    value: function print() {
      var stats = '\n';
      stats += ('STATS ' + new Array(66).fill('-').join('') + '\n').cyan;
      stats += '\n';
      stats += 'Task started:   ' + this.start.format('MM/DD/YYYY HH:mm:ss') + '\n';
      stats += 'Task ended:     ' + (0, _moment2.default)().format('MM/DD/YYYY HH:mm:ss') + '\n';
      stats += ('Time spent:     ' + this.start.toNow(true) + '\n').yellow;
      stats += '\n';
      stats += ('Rows total:     ' + this.entries + '\n').yellow;
      stats += ('Rows imported:  ' + this.imported + '\n').green;
      stats += ('Rows failed:    ' + this.errors + '\n').red;
      stats += '\n';
      process.stdout.write(stats + '\n');
    }
  }, {
    key: 'entries',
    get: function get() {
      return this._entries;
    }
  }, {
    key: 'imported',
    get: function get() {
      return this.entries - this.errors;
    }
  }, {
    key: 'errors',
    get: function get() {
      return this._errors;
    }
  }, {
    key: 'start',
    get: function get() {
      return this._start;
    }
  }, {
    key: 'micros',
    get: function get() {
      return this._micros ? _microtime2.default.now() - this._micros : 0;
    },
    set: function set(val) {
      this._micros = val || _microtime2.default.now();
    }
  }]);
  return Stats;
}();

exports.default = Stats;