'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('colors');
var path = require('path'),
    Big = require('big.js'),
    CLI = require('clui'),
    LMDB = require('../output').LMDB,
    HDF5 = require('../output').HDF5,
    Stats = require('../stats').default;

var infile = path.resolve(process.env.IN_FILE),
    outfile = path.resolve(process.env.OUT_FILE),
    basename = path.basename(outfile, path.extname(outfile)),
    fps = process.env.FPS ? Big(process.env.FPS) : Big('100.0'),
    spinner = new CLI.Spinner('Reducing...'),
    lmdb = new LMDB(),
    lmdbOut = new LMDB();

lmdb.openEnv(infile);
lmdbOut.openEnv(outfile);

var _loop = function _loop(id) {
  process.stdout.write(('Opening DB ' + id + '...\n').cyan);
  lmdb.openDb(id);
  var hdf = HDF5.createFile(path.join(path.dirname(outfile), basename + '.h5')),
      hdfgroup = HDF5.createGroup(hdf, id);
  hdfgroup.title = basename;
  hdfgroup.flush();
  var outId = lmdbOut.createDb((0, _assign2.default)({}, lmdb.meta[id]));
  var txnRead = lmdb.beginTxn(true),
      txnWrite = lmdbOut.beginTxn(),
      interval = Big('1000.0').div(fps);
  var table = false,
      running = true,
      max = void 0,
      millis = 0;
  lmdb.initCursor(txnRead, id);
  if (!process.env.DEBUG_MODE) {
    spinner.start();
  }

  var stats = new Stats(),
      statsOut = new Stats();
  while (running) {
    var key = void 0,
        entry = lmdb.getCursorData(txnRead, id, true);
    stats.addEntries();
    if (millis === undefined) {
      max = entry.data.clone();
      millis = entry.key;
      key = LMDB.stringKeyFromFloat(millis, lmdb.meta[id].key.length, lmdb.meta[id].key.precision, lmdb.meta[id].key.signed);
      lmdbOut.put(txnWrite, outId, key, max);
      var records = lmdb.meta[id].labels.map(function (label, idx) {
        var column = Float64Array.from([max[idx]]);
        column.name = label;
        return column;
      });
      if (table) {
        HDF5.appendRecords(hdfgroup.id, id, records);
      } else {
        HDF5.makeTable(hdfgroup.id, id, records);
        table = true;
      }
      statsOut.addEntries();
    }
    max = entry.data;
    millis = entry.key;
    lmdb.advanceCursor(id);
    entry = lmdb.getCursorData(txnRead, id, true);
    while (entry.key.minus(millis).lt(interval) && entry.key.minus(millis).gte(Big('0.0'))) {
      entry.data.forEach(function (val, i) {
        if (max && val > max[i]) max[i] = val;
      });
      lmdb.advanceCursor(id);
      entry = lmdb.getCursorData(txnRead, id, true);
      stats.addEntries();
    }
    if (entry.key.minus(millis).lt(Big('0.0'))) {
      running = false;
    } else {
      key = LMDB.stringKeyFromFloat(millis, lmdb.meta[id].key.length, lmdb.meta[id].key.precision, lmdb.meta[id].key.signed);
      lmdbOut.put(txnWrite, outId, key, max);
      var _records = lmdb.meta[id].labels.map(function (label, idx) {
        var column = Float64Array.from([max[idx]]);
        column.name = label;
        return column;
      });
      if (table) {
        HDF5.appendRecords(hdfgroup.id, id, _records);
      } else {
        HDF5.makeTable(hdfgroup.id, id, _records);
        table = true;
      }
      statsOut.addEntries();
      lmdb.advanceCursor(id);
    }
  }

  spinner.stop();

  process.stdout.write('Closing...'.yellow);
  lmdbOut.endTxn(txnWrite);
  lmdbOut.close();
  hdfgroup.close();
  hdf.close();
  lmdb.endTxn(txnRead, false);
  lmdb.close();
  process.stdout.write('Done.\n'.yellow);

  process.stdout.write('\nINPUT'.cyan);
  stats.print();
  process.stdout.write('\nOUTPUT'.cyan);
  statsOut.print();
};

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  for (var _iterator = (0, _getIterator3.default)(lmdb.dbIds), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    var id = _step.value;

    _loop(id);
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