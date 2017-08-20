'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('colors');
var path = require('path'),
    moment = require('moment'),
    Big = require('big.js'),
    microtime = require('microtime'),
    CLI = require('clui'),
    Playback = require('../playback'),
    LMDB = require('../output').LMDB;

var infile = path.resolve(process.env.IN_FILE),
    local = process.env.ADDR_LOCAL || '0.0.0.0:8888',
    remote = process.env.ADDR_REMOTE || '127.0.0.1:9999',
    broadcast = remote.indexOf('.255:') !== -1,
    debug = process.env.DEBUG_MODE,
    fps = process.env.FPS ? Big(process.env.FPS) : Big('50.0'),
    oscDefaultAddress = process.env.OSC_ADDRESS && process.env.OSC_ADDRESS[0] === '/' ? process.env.OSC_ADDRESS : null,
    osc = new Playback.OSC(local, remote, broadcast),
    spinner = new CLI.Spinner('Sending...'),
    lmdb = new LMDB(),
    schedulers = [];

lmdb.openEnv(infile);

osc.on('ready', function () {
  var _loop = function _loop(id) {
    process.stdout.write(('Opening DB ' + id + '...\n').cyan);
    lmdb.openDb(id);
    var address = oscDefaultAddress || '/' + id.split('-')[0],
        txn = lmdb.beginTxn(true),
        interval = Big('1000').div(fps).round(0),
        scheduler = new Playback.Scheduler();
    var max = void 0,
        bundle = void 0,
        isBuildingFrame = false,
        millis = Big('0.0'),
        slow = false,
        frameTime = Big('0.0'),
        lastFrame = Big(microtime.nowDouble().toString()).times(Big('1000'));

    lmdb.initCursor(txn, id);
    process.stdout.write(('Sending packets to osc://' + remote + address + ' at ' + fps.toFixed(2) + 'fps\n\n').yellow);

    var intervalStr = interval + 'ms';
    scheduler.interval(intervalStr, function () {
      if (isBuildingFrame) return;
      isBuildingFrame = true;
      if (bundle) osc.sendBundle(bundle);
      var entry = lmdb.getCursorData(txn, id, true);
      max = entry.data;
      millis = entry.key;
      while (entry.key.minus(millis).lt(interval) && entry.key.minus(millis).gte(Big('0.0'))) {
        entry.data.forEach(function (val, i) {
          if (max && val > max[i]) max[i] = val;
        });
        lmdb.advanceCursor(id);
        entry = lmdb.getCursorData(txn, id, true);
      }
      bundle = Playback.OSC.buildMessage(address, max);
      isBuildingFrame = false;
      var msg = 'Sending... ' + moment(Math.round(millis)).format('HH:mm:ss:SSS') + ' (Press Ctrl-C to abort)';
      if (debug) {
        var nowMillis = Big(microtime.nowDouble().toString()).times(Big('1000'));
        frameTime = lastFrame.sub(nowMillis);
        lastFrame = nowMillis;
        slow = frameTime.gt(interval);
        if (slow) {
          msg += ' SLOW FRAME: ' + frameTime.toFixed(3) + 'ms';
        }
      }
      spinner.message(msg);
    });
    schedulers.push(scheduler);
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

  if (!debug) {
    spinner.start();
  }
});