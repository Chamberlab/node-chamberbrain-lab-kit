'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Logger = function () {
  function Logger() {
    (0, _classCallCheck3.default)(this, Logger);
  }

  (0, _createClass3.default)(Logger, null, [{
    key: 'log',
    value: function log(msg) {
      process.stdout.write(msg);
    }
  }, {
    key: 'error',
    value: function error(msg) {
      process.stderr.write(msg);
    }
  }, {
    key: 'debug',
    value: function debug(msg) {
      var module = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'cl';

      (0, _debug2.default)(module)(msg);
    }
  }]);
  return Logger;
}();

exports.default = Logger;