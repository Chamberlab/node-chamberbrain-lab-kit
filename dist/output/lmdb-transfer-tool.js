'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lmdb = require('./lmdb');

var _lmdb2 = _interopRequireDefault(_lmdb);

var _stats = require('../stats');

var _stats2 = _interopRequireDefault(_stats);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LMDBTransferTool = function () {
  function LMDBTransferTool(infile, outfile) {
    (0, _classCallCheck3.default)(this, LMDBTransferTool);

    this._in = {
      lmdb: new _lmdb2.default(),
      stats: new _stats2.default(),
      txn: undefined
    };
    this._in.lmdb.openEnv(infile);
    this._in.txn = this._in.lmdb.beginTxn(true);

    this._out = {
      lmdb: new _lmdb2.default(),
      stats: new _stats2.default(),
      txn: undefined
    };
    this._out.lmdb.openEnv(outfile);
    this._out.txn = this._out.lmdb.beginTxn();
  }

  (0, _createClass3.default)(LMDBTransferTool, [{
    key: 'addRecord',
    value: function addRecord(id, millis, data) {
      var meta = this._in.lmdb.meta[id],
          key = _lmdb2.default.stringKeyFromFloat(millis, meta.key.length, meta.key.precision, meta.key.signed);
      this._out.lmdb.put(this.out.txn, id, key, data);
      this._out.stats.addEntries();
    }
  }, {
    key: 'close',
    value: function close() {
      process.stdout.write('Closing LMDB environments...'.yellow);
      this._out.lmdb.endTxn(this.out.txn);
      this._out.lmdb.close();
      this._in.lmdb.endTxn(this._in.txn, false);
      this._in.lmdb.close();
      process.stdout.write('Done.\n'.yellow);

      process.stdout.write('\nINPUT'.cyan);
      this._in.stats.print();

      process.stdout.write('\nOUTPUT'.cyan);
      this._out.stats.print();
    }
  }, {
    key: 'in',
    get: function get() {
      return this._in;
    }
  }, {
    key: 'out',
    get: function get() {
      return this._out;
    }
  }]);
  return LMDBTransferTool;
}();

exports.default = LMDBTransferTool;