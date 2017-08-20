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

var _hdf = require('hdf5');

var _globals = require('hdf5/lib/globals');

var _globals2 = _interopRequireDefault(_globals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HDF5 = function () {
  function HDF5() {
    (0, _classCallCheck3.default)(this, HDF5);
  }

  (0, _createClass3.default)(HDF5, null, [{
    key: 'appendRecords',
    value: function appendRecords(id, title, records) {
      _assert2.default.notEqual(typeof id === 'undefined' ? 'undefined' : (0, _typeof3.default)(id), 'undefined');
      _assert2.default.equal(typeof title === 'undefined' ? 'undefined' : (0, _typeof3.default)(title), 'string');
      _assert2.default.ok(Array.isArray(records));
      _hdf.h5tb.appendRecords(id, title, records);
    }
  }, {
    key: 'makeTable',
    value: function makeTable(id, title, model) {
      _assert2.default.notEqual(typeof id === 'undefined' ? 'undefined' : (0, _typeof3.default)(id), 'undefined');
      _assert2.default.equal(typeof title === 'undefined' ? 'undefined' : (0, _typeof3.default)(title), 'string');
      _assert2.default.ok(Array.isArray(model));
      _hdf.h5tb.makeTable(id, title, model);
    }
  }, {
    key: 'createGroup',
    value: function createGroup(file, groupName) {
      _assert2.default.notEqual(typeof file === 'undefined' ? 'undefined' : (0, _typeof3.default)(file), 'undefined');
      _assert2.default.equal(typeof groupName === 'undefined' ? 'undefined' : (0, _typeof3.default)(groupName), 'string');
      return file.createGroup(groupName);
    }
  }, {
    key: 'createFile',
    value: function createFile(filename) {
      return new _hdf.hdf5.File(filename, _globals2.default.Access.ACC_TRUNC);
    }
  }, {
    key: 'TYPES',
    get: function get() {
      return {
        FLOAT64: 0
      };
    }
  }]);
  return HDF5;
}();

exports.default = HDF5;