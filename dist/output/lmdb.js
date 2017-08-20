'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sign = require('babel-runtime/core-js/math/sign');

var _sign2 = _interopRequireDefault(_sign);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _nodeLmdb = require('node-lmdb');

var _nodeLmdb2 = _interopRequireDefault(_nodeLmdb);

var _util = require('../util');

var _big = require('big.js');

var _big2 = _interopRequireDefault(_big);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var msgs = {
  env_exists: 'Environment already initialized',
  bad_arg: 'Bad argument type',
  no_dbi: 'Database not opened',
  no_cursor: 'Cursor not initialized',
  no_meta: 'No metadata',
  no_txn: 'Must pass transaction'
};

var LMDB = function () {
  function LMDB() {
    (0, _classCallCheck3.default)(this, LMDB);

    this._env = undefined;
    this._meta = {};
  }

  (0, _createClass3.default)(LMDB, [{
    key: 'openEnv',
    value: function openEnv(filename) {
      var maxSizeGb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;
      var maxDbs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

      _assert2.default.equal((0, _typeof3.default)(this._env), 'undefined', msgs.env_exists);
      _assert2.default.equal(typeof filename === 'undefined' ? 'undefined' : (0, _typeof3.default)(filename), 'string', msgs.bad_arg);
      _assert2.default.equal(typeof maxSizeGb === 'undefined' ? 'undefined' : (0, _typeof3.default)(maxSizeGb), 'number', msgs.bad_arg);
      _assert2.default.equal(typeof maxDbs === 'undefined' ? 'undefined' : (0, _typeof3.default)(maxDbs), 'number', msgs.bad_arg);
      _assert2.default.ok((0, _isInteger2.default)(maxDbs), msgs.bad_arg);

      this._filename = filename;
      if (!_fs2.default.existsSync(this._filename)) {
        _fs2.default.mkdirSync(this._filename);
      } else {
        this.loadMeta();
      }

      this._env = new _nodeLmdb2.default.Env();
      this._env.open({
        path: filename,
        mapSize: Math.round(maxSizeGb * Math.pow(1024, 3)),
        maxDbs: maxDbs
      });
    }
  }, {
    key: 'createDb',
    value: function createDb() {
      var meta = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _assert2.default.notEqual(typeof meta === 'undefined' ? 'undefined' : (0, _typeof3.default)(meta), 'undefined', msgs.bad_arg);
      var dbId = (0, _v2.default)();
      this._meta[dbId] = { meta: meta };
      this._meta[dbId].dbi = this._env.openDbi({
        name: dbId,
        create: true
      });
      this.storeMeta();
      return dbId;
    }
  }, {
    key: 'openDb',
    value: function openDb(dbId) {
      _assert2.default.equal(typeof dbId === 'undefined' ? 'undefined' : (0, _typeof3.default)(dbId), 'string', msgs.bad_arg);
      if (!this._meta[dbId].dbi) {
        this._meta[dbId].dbi = this._env.openDbi({
          name: dbId
        });
      }
    }
  }, {
    key: 'beginTxn',
    value: function beginTxn() {
      var readOnly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      return this._env.beginTxn({ readOnly: readOnly });
    }
  }, {
    key: 'endTxn',
    value: function endTxn(txn) {
      var commit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      if (commit) {
        return txn.commit();
      }
      txn.abort();
    }
  }, {
    key: 'put',
    value: function put(txn, dbId, key, data) {
      _assert2.default.notEqual(typeof txn === 'undefined' ? 'undefined' : (0, _typeof3.default)(txn), 'undefined', msgs.no_txn);
      _assert2.default.notEqual((0, _typeof3.default)(this._meta[dbId].dbi), 'undefined', msgs.no_dbi);
      _assert2.default.equal(typeof key === 'undefined' ? 'undefined' : (0, _typeof3.default)(key), 'string', msgs.bad_arg);
      txn.putBinary(this._meta[dbId].dbi, key, data);
    }
  }, {
    key: 'initCursor',
    value: function initCursor(txn, dbId) {
      var positionKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

      _assert2.default.notEqual(typeof txn === 'undefined' ? 'undefined' : (0, _typeof3.default)(txn), 'undefined', msgs.no_txn);
      _assert2.default.notEqual((0, _typeof3.default)(this._meta[dbId].dbi), 'undefined');
      if (!this._meta[dbId].cursor) {
        this._meta[dbId].cursor = {
          obj: new _nodeLmdb2.default.Cursor(txn, this._meta[dbId].dbi),
          key: null,
          nextKey: null
        };
      }
      if (positionKey) {
        // TODO: implement alternate start position
      }
      this._meta[dbId].cursor.key = this._meta[dbId].cursor.obj.goToFirst();
      this._meta[dbId].cursor.nextKey = this._meta[dbId].cursor.obj.goToNext();
    }
  }, {
    key: 'advanceCursor',
    value: function advanceCursor(dbId) {
      _assert2.default.notEqual((0, _typeof3.default)(this._meta[dbId].cursor), 'undefined', msgs.no_cursor);
      if (!this._meta[dbId].cursor.nextKey) {
        this._meta[dbId].cursor.nextKey = this._meta[dbId].cursor.obj.goToFirst();
      }
      this._meta[dbId].cursor.key = this._meta[dbId].cursor.nextKey;
      this._meta[dbId].cursor.nextKey = this._meta[dbId].cursor.obj.goToNext();
    }
  }, {
    key: 'getCursorData',
    value: function getCursorData(txn, dbId) {
      var parseKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      _assert2.default.notEqual(typeof txn === 'undefined' ? 'undefined' : (0, _typeof3.default)(txn), 'undefined', msgs.no_txn);
      _assert2.default.notEqual((0, _typeof3.default)(this._meta[dbId].cursor), 'undefined', msgs.no_cursor);
      var buffer = txn.getBinary(this._meta[dbId].dbi, this._meta[dbId].cursor.key);
      var data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      switch (this._meta[dbId].meta.type) {
        case LMDB.TYPES.FLOAT32:
          data = new Float32Array(data, data.byteOffset, data.byteLength / Float32Array.BYTES_PER_ELEMENT);
          break;
        default:
          data = new Float64Array(data, data.byteOffset, data.byteLength / Float64Array.BYTES_PER_ELEMENT);
      }
      if (this._meta[dbId].cursor.key) {
        return {
          key: parseKey ? LMDB.parseKey(this._meta[dbId].cursor.key) : this._meta[dbId].cursor.key,
          data: data
        };
      }
    }
  }, {
    key: 'loadMeta',
    value: function loadMeta() {
      if (_fs2.default.existsSync(_path2.default.join(this._filename, 'meta.json'))) {
        this.meta = JSON.parse(_fs2.default.readFileSync(_path2.default.join(this._filename, 'meta.json')));
      }
    }
  }, {
    key: 'storeMeta',
    value: function storeMeta() {
      _assert2.default.notEqual((0, _typeof3.default)(this._meta), 'undefined', msgs.no_meta);
      _assert2.default.ok(this.dbIds.length > 0, msgs.no_meta);
      _fs2.default.writeFileSync(_path2.default.join(this._filename, 'meta.json'), (0, _stringify2.default)(this.meta, null, 2));
    }
  }, {
    key: 'close',
    value: function close() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(this.dbIds), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var id = _step.value;

          if (this._meta[id].dbi) {
            this._meta[id].dbi.close();
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this._env.close();
    }
  }, {
    key: 'env',
    get: function get() {
      return this._env;
    },
    set: function set(filename) {
      _assert2.default.equal(typeof filename === 'undefined' ? 'undefined' : (0, _typeof3.default)(filename), 'string', msgs.bad_arg);
      this.openEnv(filename);
    }
  }, {
    key: 'meta',
    get: function get() {
      var ctx = this,
          meta = {};
      (0, _keys2.default)(this._meta).forEach(function (key) {
        if (ctx._meta[key].meta) {
          meta[key] = (0, _assign2.default)({}, ctx._meta[key].meta);
        }
      });
      return meta;
    },
    set: function set(meta) {
      var ctx = this;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(this.dbIds), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var id = _step2.value;

          if (this._meta[id].cursor) {
            this._meta[id].cursor.close();
          }
          if (this._meta[id].dbi) {
            this._meta[id].dbi.close();
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      this._meta = {};
      (0, _keys2.default)(meta).forEach(function (key) {
        if (meta[key] instanceof Object) ctx._meta[key] = { meta: (0, _assign2.default)({}, meta[key]) };
      });
    }
  }, {
    key: 'dbIds',
    get: function get() {
      return (0, _keys2.default)(this._meta);
    },
    set: function set(val) {
      /* ignored */
    }
  }], [{
    key: 'stringKeyFromFloat',
    value: function stringKeyFromFloat(value) {
      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;
      var precision = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 6;
      var signed = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var fixed = (0, _big2.default)(Math.abs(value)).toFixed(precision);
      var prefix = '';
      if (signed) {
        prefix = (0, _sign2.default)(value) > 0 ? '+' : '-';
      }
      return prefix + (0, _util.padString)(fixed, length - prefix.length, '0', true);
    }
  }, {
    key: 'parseKey',
    value: function parseKey(key) {
      return (0, _big2.default)(key);
    }
  }, {
    key: 'TYPES',
    get: function get() {
      return {
        FLOAT64: 0,
        FLOAT32: 1
      };
    }
  }]);
  return LMDB;
}();

exports.default = LMDB;