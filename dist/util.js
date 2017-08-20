'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseDouble = exports.padString = undefined;

var _big = require('big.js');

var _big2 = _interopRequireDefault(_big);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var padString = function padString(str, length) {
  var char = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ' ';
  var padLeft = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var pad = new Array(length - str.length).fill(char).join('');
  if (padLeft) {
    return pad + str;
  }
  return str + pad;
};

var parseDouble = function parseDouble(value) {
  try {
    return (0, _big2.default)(value);
  } catch (err) {
    return null;
  }
};

exports.padString = padString;
exports.parseDouble = parseDouble;