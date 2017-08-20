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

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fastCsv = require('fast-csv');

var _fastCsv2 = _interopRequireDefault(_fastCsv);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CSV = function () {
  function CSV() {
    (0, _classCallCheck3.default)(this, CSV);
  }

  (0, _createClass3.default)(CSV, null, [{
    key: 'parseFile',
    value: function parseFile(filename, dataCallback, endCallback) {
      var stream = CSV.getStream(filename);
      CSV.parseStream(stream, dataCallback, endCallback);
    }
  }, {
    key: 'parseStream',
    value: function parseStream(stream, dataCallback, endCallback) {
      _assert2.default.ok(stream instanceof _fs2.default.ReadStream);
      _assert2.default.equal(typeof dataCallback === 'undefined' ? 'undefined' : (0, _typeof3.default)(dataCallback), 'function');
      _assert2.default.equal(typeof endCallback === 'undefined' ? 'undefined' : (0, _typeof3.default)(endCallback), 'function');

      var csvStream = _fastCsv2.default.parse({ trim: true }).on('data', dataCallback).on('error', function (err) {
        endCallback(err);
      }).on('end', function () {
        endCallback();
      });
      stream.pipe(csvStream);
    }
  }, {
    key: 'getStream',
    value: function getStream(filename) {
      _assert2.default.equal(typeof filename === 'undefined' ? 'undefined' : (0, _typeof3.default)(filename), 'string');
      process.stdout.write('Opening CSV file for input at:\n' + filename + '\n\n');
      return _fs2.default.createReadStream(filename);
    }
  }]);
  return CSV;
}();

exports.default = CSV;