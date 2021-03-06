'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('colors');
var path = require('path'),
    moment = require('moment'),
    Big = require('big.js'),
    CLI = require('clui'),
    PB = require('../playback'),
    Stats = require('../stats').default,
    Logger = require('../logger').default,
    LMDB = require('../output').LMDB;

var streams = {},
    spinner = new CLI.Spinner(),
    lmdb = new LMDB(),
    osc = new PB.OSC(process.env.ADDR_LOCAL, process.env.ADDR_REMOTE, process.env.ADDR_REMOTE.indexOf('.255:') !== -1);

lmdb.openEnv(path.resolve(process.env.IN_FILE));
osc.on('ready', function () {
  Logger.debug('Ready', 'cl:osc');

  var _loop = function _loop(id) {
    Logger.debug('Init', 'cl:scheduler');
    var bundle = void 0,
        keyMillis = void 0,
        busy = void 0;
    var address = process.env.OSC_ADDRESS || '/' + id.split('-')[0],
        proc = {
      seq: new PB.Scheduler(),
      frames: new PB.Frames(),
      stats: new Stats()
    };
    proc.frames.fps = process.env.FPS;
    streams[id] = proc;

    Logger.log(('Reading data from LMDB database ' + id + '...\n').cyan + ('Sending packets to osc://' + process.env.ADDR_REMOTE + address + ' ') + ('at ' + Big(process.env.FPS).toFixed(2) + 'fps\n\n').yellow);

    lmdb.openDb(id);
    var txn = lmdb.beginTxn(true);
    lmdb.initCursor(txn, id);

    proc.seq.interval(proc.frames.interval.micros + 'u', function () {
      if (process.env.DEBUG) proc.stats.getFrameDiff();
      proc.stats.workTime = proc.seq.duration(function () {
        if (busy) throw new Error('Scheduler calls overlap');
        busy = true;

        if (bundle) {
          osc.sendBundle(bundle);
          var msg = 'Sending... ' + moment(Math.round(keyMillis)).format('HH:mm:ss:SSS') + ' (Ctrl-C to exit)';
          if (process.env.DEBUG) proc.stats.checkSlowFrame(proc.frames.interval);else if (spinner) spinner.message(msg);
        }

        var keyDiff = void 0,
            entry = lmdb.getCursorData(txn, id, true);
        keyMillis = entry.key;
        keyDiff = entry.key.minus(keyMillis);
        proc.frames.data = entry.data;
        while (keyDiff.lt(proc.frames.interval.millis) && keyDiff.gte(Big(0))) {
          proc.frames.interpolate(entry.data, PB.Frames.INTERPOLATE.MAX);
          lmdb.advanceCursor(id);
          entry = lmdb.getCursorData(txn, id, true);
          keyDiff = entry.key.minus(keyMillis);
        }

        bundle = PB.OSC.buildMessage(address, streams[id].frames.data);
        busy = false;
      });

      if (process.env.DEBUG) {
        Logger.debug('Work: ' + proc.stats.workTime + '\u03BCs', 'cl:scheduler');
      }
    });
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

  if (!process.env.DEBUG) spinner.start();
});