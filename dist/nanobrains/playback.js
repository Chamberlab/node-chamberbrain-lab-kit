'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('colors');
var path = require('path'),
    Debug = require('debug'),
    moment = require('moment'),
    Big = require('big.js'),
    microtime = require('microtime'),
    CLI = require('clui'),
    Playback = require('../playback'),
    LMDB = require('../output').LMDB;

var lmdb = new LMDB(),
    osc = new Playback.OSC(process.env.ADDR_LOCAL, process.env.ADDR_REMOTE, process.env.ADDR_REMOTE.indexOf('.255:') !== -1);

lmdb.openEnv(path.resolve(process.env.IN_FILE));
osc.on('ready', function () {
  Debug('cl:osc')('Ready');

  var spinner = void 0,
      schedulers = void 0;

  var _loop = function _loop(id) {
    process.stdout.write(('Opening DB ' + id + '...\n').cyan);
    lmdb.openDb(id);

    Debug('cl:scheduler')('Init');
    var address = process.env.OSC_ADDRESS || '/' + id.split('-')[0];
    var interpolated = void 0,
        bundle = void 0,
        millis = void 0,
        slow = void 0,
        busy = void 0,
        frameTime = void 0,
        lastFrameTime = void 0;

    if (process.env.DEBUG) {
      lastFrameTime = microtime.now();
    }

    var txn = lmdb.beginTxn(true);
    lmdb.initCursor(txn, id);

    process.stdout.write('Sending packets to osc://' + process.env.ADDR_REMOTE + address + ' ' + ('at ' + Big(process.env.FPS).toFixed(2) + 'fps\n\n').yellow);

    var scheduler = new Playback.Scheduler(),
        intervalMicros = Big('1000000').div(Big(process.env.FPS)).round(0),
        intervalMillis = intervalMicros.div(Big('1000')).round(0);
    scheduler.interval(intervalMillis + 'm', function () {
      if (process.env.DEBUG) {
        var nowMicros = microtime.now();
        Debug('cl:scheduler')('Diff: ' + (nowMicros - lastFrameTime) + '\u03BCs');
        lastFrameTime = nowMicros;
      }
      var msg = '',
          entry = void 0;
      if (busy) {
        throw new Error('Scheduler calls overlap!');
      }
      busy = true;

      if (bundle) {
        osc.sendBundle(bundle);
        msg += 'Sending... ' + moment(Math.round(millis)).format('HH:mm:ss:SSS') + ' (Press Ctrl-C to abort)';
        if (process.env.DEBUG && slow) {
          if (slow) {
            msg += ' SLOW FRAME: ' + frameTime + '\u03BCs';
          }
          Debug('cl:osc')(msg);
        } else {
          if (spinner) spinner.message(msg);
        }
      }

      entry = lmdb.getCursorData(txn, id, true);
      interpolated = entry.data;
      millis = entry.key;

      while (entry.key.minus(millis).lt(intervalMillis) && entry.key.minus(millis).gte(Big('0.0'))) {
        entry.data.forEach(function (val, i) {
          if (interpolated && val > interpolated[i]) interpolated[i] = val;
        });
        lmdb.advanceCursor(id);
        entry = lmdb.getCursorData(txn, id, true);
      }

      bundle = Playback.OSC.buildMessage(address, interpolated);
      busy = false;

      if (process.env.DEBUG) {
        var _nowMicros = microtime.now();
        frameTime = _nowMicros - lastFrameTime;
        slow = Big(frameTime).gt(intervalMicros);
        Debug('cl:scheduler')('Work: ' + frameTime + '\u03BCs');
      }
    });
    if (!schedulers) {
      schedulers = [scheduler];
      return 'continue';
    }
    schedulers.push(scheduler);
  };

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(lmdb.dbIds), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var id = _step.value;

      var _ret = _loop(id);

      if (_ret === 'continue') continue;
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

  if (!process.env.DEBUG) {
    if (!spinner) {
      spinner = new CLI.Spinner('Sending...');
    }
    spinner.start();
  }
});