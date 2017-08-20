'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

require('colors');

var _tinyEmitter = require('tiny-emitter');

var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _input = require('../input');

var input = _interopRequireWildcard(_input);

var _output = require('../output');

var output = _interopRequireWildcard(_output);

var _stats = require('../stats');

var _stats2 = _interopRequireDefault(_stats);

var _util = require('../util');

var _lmdb = require('../output/lmdb');

var _lmdb2 = _interopRequireDefault(_lmdb);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var csvToLMDB = function csvToLMDB(infile, outdir) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var statusHandler = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
  var endHandler = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;

  process.stdout.write(('\nCSV 2 LMDB ' + new Array(61).fill('-').join('') + '\n\n').cyan);
  options = (0, _assign2.default)({
    flushEvery: 10000,
    dataStart: 0,
    keyColumn: 0,
    type: _lmdb2.default.TYPES.FLOAT64,
    key: {
      column: 0,
      length: 16,
      precision: 6,
      signPrefix: true
    }
  }, options);
  var emitter = new _tinyEmitter2.default(),
      stats = new _stats2.default();
  if (typeof statusHandler === 'function') {
    emitter.on('status', statusHandler);
  }
  if (typeof endHandler === 'function') {
    emitter.on('end', endHandler);
  }
  return new _promise2.default(function (resolve, reject) {
    var row = 0,
        basename = void 0,
        dbUUID = void 0,
        txn = void 0;
    var lmdb = new output.LMDB(),
        meta = {
      type: options.type,
      key: options.key
    };

    var onData = function onData(data) {
      if (row >= options.dataStart) {
        var parsedKey = (0, _util.parseDouble)(data[options.key.column]),
            key = output.LMDB.stringKeyFromFloat(parsedKey === null ? 0 : parsedKey, options.key.length, options.key.precision, options.key.signPrefix);
        var values = void 0,
            hasError = false;
        switch (options.type) {
          case _lmdb2.default.TYPES.FLOAT32:
            values = Float32Array.from(data.map(function (val) {
              var parsed = (0, _util.parseDouble)(val);
              hasError = hasError || parsed === null;
              return hasError ? 0.0 : parsed;
            }));
            break;
          default:
            values = Float64Array.from(data.map(function (val) {
              var parsed = (0, _util.parseDouble)(val);
              hasError = hasError || parsed === null;
              return hasError ? 0.0 : parsed;
            }));
        }
        if (hasError) {
          stats.addErrors();
        } else {
          lmdb.put(txn, dbUUID, key, values);
          stats.addEntries();
        }
        if (stats.entries % options.flushEvery === 0) {
          lmdb.endTxn(txn);
          emitter.emit('status', (0, _util.padString)('Parsed ' + stats.entries + ' rows...', 32));
          txn = lmdb.beginTxn();
        }
      } else {
        if (Array.isArray(options.metaRange) && row >= options.metaRange[0] && row < options.metaRange[1]) {
          meta[data[0]] = data[1];
        } else if (typeof options.labelRow === 'number' && row === options.labelRow) {
          meta.labels = data;
        }
        if (options.dataStart === 0 || row === options.dataStart - 1) {
          basename = _path2.default.basename(infile, _path2.default.extname(infile));
          var outpath = _path2.default.join(outdir, basename + '.lmdb');
          process.stdout.write('Opening LMDB environment for output at:\n' + outpath + '\n\n');
          lmdb.openEnv(outpath, 4, 1);
          meta.title = basename;
          dbUUID = lmdb.createDb(meta);
          txn = lmdb.beginTxn();
          emitter.emit('status', (0, _util.padString)('Parsing rows... ', 32));
        }
      }
      row++;
    },
        onEnd = function onEnd(err) {
      emitter.emit('end');
      process.stdout.write(('Parsed ' + stats.entries + ' rows, closing environment...').yellow);
      lmdb.endTxn(txn);
      lmdb.close();
      process.stdout.write('Done.\n'.yellow);
      if (err) {
        return reject(err);
      }
      resolve(stats);
    };

    input.CSV.parseFile(infile, onData, onEnd);
  });
};

exports.default = csvToLMDB;