'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('colors');
var path = require('path'),
    Debug = require('debug'),
    moment = require('moment'),
    microtime = require('microtime'),
    Big = require('big.js'),
    CLI = require('clui'),
    PB = require('../playback'),
    LMDB = require('../output').LMDB;

var streams = {},
    spinner = new CLI.Spinner(),
    lmdb = new LMDB(),
    osc = new PB.OSC(process.env.ADDR_LOCAL, process.env.ADDR_REMOTE, process.env.ADDR_REMOTE.indexOf('.255:') !== -1);

lmdb.openEnv(path.resolve(process.env.IN_FILE));
osc.on('ready', function () {
  Debug('cl:osc')('Ready');

  var _loop = function _loop(id) {
    var bundle = void 0,
        millis = void 0,
        slow = void 0,
        busy = void 0,
        frameTime = void 0,
        workTime = void 0;
    var address = process.env.OSC_ADDRESS || '/' + id.split('-')[0],
        interval = {
      micros: Big(1000000).div(Big(process.env.FPS)).round(0),
      millis: Big(1000).div(Big(process.env.FPS)).round(0)
    };

    process.stdout.write(('Opening DB ' + id + '...\n').cyan);
    process.stdout.write('Sending packets to osc://' + process.env.ADDR_REMOTE + address + ' ' + ('at ' + Big(process.env.FPS).toFixed(2) + 'fps\n\n').yellow);
    lmdb.openDb(id);
    var txn = lmdb.beginTxn(true);

    Debug('cl:scheduler')('Init');
    streams[id] = {
      scheduler: new PB.Scheduler(),
      frames: new PB.Frames()
    };
    lmdb.initCursor(txn, id);
    frameTime = microtime.now();
    streams[id].scheduler.interval(interval.micros + 'u', function () {
      if (process.env.DEBUG) {
        Debug('cl:scheduler')('Diff: ' + (microtime.now() - frameTime) + '\u03BCs');
        frameTime = microtime.now();
      }
      workTime = streams[id].scheduler.duration(function () {
        if (busy) throw new Error('Scheduler calls overlap');
        busy = true;

        if (bundle) {
          osc.sendBundle(bundle);
          var msg = 'Sending... ' + moment(Math.round(millis)).format('HH:mm:ss:SSS') + ' (Ctrl-C to exit)';
          if (process.env.DEBUG && slow) {
            if (slow) msg += (' SLOW FRAME: ' + (workTime - interval.micros) + '\u03BCs over limit').red;
            Debug('cl:osc')(msg);
          } else if (spinner) spinner.message(msg);
        }

        var entry = lmdb.getCursorData(txn, id, true);
        streams[id].frames.data = entry.data;
        millis = entry.key;

        while (entry.key.minus(millis).lt(interval.millis) && entry.key.minus(millis).gte(Big(0))) {
          streams[id].frames.interpolate(entry.data, PB.Frames.INTERPOLATE.MAX);
          lmdb.advanceCursor(id);
          entry = lmdb.getCursorData(txn, id, true);
        }

        bundle = PB.OSC.buildMessage(address, streams[id].frames.data);
        busy = false;
      });

      if (process.env.DEBUG) {
        Debug('cl:scheduler')('Work: ' + workTime + '\u03BCs');
        slow = Big(workTime).gt(interval.micros);
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