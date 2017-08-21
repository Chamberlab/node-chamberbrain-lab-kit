'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('colors');
var path = require('path'),
    moment = require('moment'),
    Promise = require('bluebird'),
    Big = require('big.js'),
    CLI = require('clui'),
    PB = require('../playback'),
    Stats = require('../stats').default,
    Logger = require('../logger').default,
    LMDBTransferTool = require('../output').LMDBTransferTool;

var processors = {},
    infile = path.resolve(process.env.IN_FILE),
    outfile = path.resolve(process.env.OUT_FILE),
    spinner = new CLI.Spinner(),
    ltt = new LMDBTransferTool(infile, outfile);

var worker = function worker(args) {
  var _args = (0, _slicedToArray3.default)(args, 6),
      id = _args[0],
      ltt = _args[1],
      proc = _args[2],
      keyMillis = _args[3],
      isRunning = _args[4],
      resolve = _args[5];

  proc.stats.workTime = proc.seq.duration(function () {
    if (spinner) spinner.message('Sending... ' + moment(Math.round(keyMillis)).format('HH:mm:ss:SSS'));

    var keyDiff = void 0,
        entry = ltt.getCursorData(ltt.in.txn, id, true);
    keyMillis = entry.key;
    keyDiff = entry.key.minus(keyMillis);
    proc.frames.data = entry.data;
    while (isRunning && keyDiff.lt(proc.frames.interval.millis) && keyDiff.gte(Big(0))) {
      if (!keyDiff.gte(0)) isRunning = false;
      proc.frames.interpolate(entry.data, PB.Frames.INTERPOLATE.MAX);
      ltt.in.lmdb.advanceCursor(id);
      entry = ltt.in.lmdb.getCursorData(ltt.in.txn, id, true);
      keyDiff = entry.key.minus(keyMillis);
    }

    ltt.addRecord(proc.outId, keyMillis, proc.frames.data);
  });

  if (process.env.DEBUG) {
    Logger.debug('Work: ' + proc.stats.workTime + '\u03BCs', 'cl:reduce');
  }

  if (isRunning) {
    proc.seq.delay(0, worker, [id, ltt, proc, keyMillis, isRunning, resolve]);
  } else {
    ltt.close();
    resolve();
  }
};

Promise.map(ltt.in.lmdb.dbIds, function (id) {
  var proc = {
    frames: new PB.Frames(),
    stats: new Stats(),
    outId: undefined
  };
  ltt.in.lmdb.openDb(id);
  ltt.in.lmdb.initCursor(ltt.in.txn, id);
  proc.outId = ltt.out.lmdb.createDb((0, _assign2.default)({}, ltt.in.lmdb.meta[id]));
  proc.frames.fps = process.env.FPS;
  processors[id] = proc;

  if (!process.env.DEBUG) spinner.start();

  return new Promise(function (resolve) {
    proc.seq.delay(0, worker, [id, ltt, proc, null, true, resolve]);
  });
}).then(function () {
  process.exit(0);
}).catch(function (err) {
  Logger.error(err.message);
  Logger.debug(err.stack, 'cl:reduce');
  process.exit(err.code);
});