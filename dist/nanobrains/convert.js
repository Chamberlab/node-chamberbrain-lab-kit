'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path'),
    CLI = require('clui'),
    Convert = require('../convert');

var spinner = void 0;
var infile = path.resolve(process.env.IN_FILE),
    outdir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.dirname(infile),
    outType = process.env.OUT_TYPE || 'lmdb',
    debug = process.env.DEBUG_MODE,
    statusHandler = function statusHandler(status) {
  if (debug) {
    return process.stdout.write(status + '\n');
  }
  if (!spinner) {
    spinner = new CLI.Spinner(status);
    return spinner.start();
  }
  spinner.message(status);
},
    endHandler = function endHandler() {
  if (spinner) {
    spinner.stop();
    spinner = undefined;
  }
};

_promise2.default.resolve().then(function () {
  switch (outType) {
    case 'lmdb':
      return Convert.csvToLMDB(infile, outdir, {
        flushEvery: 100000,
        metaRange: [0, 2],
        labelRow: 3,
        dataStart: 4,
        type: process.env.DATA_TYPE || 'Float32',
        key: {
          column: 0,
          length: 10,
          precision: 2,
          signPrefix: false
        }
      }, statusHandler, endHandler);
    case 'hdf5':
      return Convert.csvToHDF5(infile, outdir, {
        flushEvery: 100000,
        metaRange: [0, 2],
        labelRow: 3,
        dataStart: 4
      }, statusHandler, endHandler);
  }
}).then(function (stats) {
  stats.print();
  process.exit(0);
}).catch(function (err) {
  console.error(err.message);
  console.error(err.stack);
  process.exit(err.code);
});