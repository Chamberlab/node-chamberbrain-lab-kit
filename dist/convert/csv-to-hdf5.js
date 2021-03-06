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

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var csvToHDF5 = function csvToHDF5(infile, outdir) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var statusHandler = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
  var endHandler = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;

  process.stdout.write(('\nCSV 2 HDF5 ' + new Array(61).fill('-').join('') + '\n\n').cyan);
  options = (0, _assign2.default)({
    flushEvery: 10000,
    dataStart: 0,
    type: output.HDF5.TYPES.FLOAT64
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
        hasError = false,
        basename = void 0,
        outfile = void 0,
        table = void 0,
        group = void 0;
    var meta = {};

    var onData = function onData(data) {
      if (row >= options.dataStart) {
        var records = meta.labels.map(function (label, idx) {
          var parsed = (0, _util.parseDouble)(data[idx]);
          hasError = hasError || parsed === null;
          var column = Float64Array.from([hasError ? 0.0 : parsed]);
          column.name = label;
          return column;
        });
        if (hasError) {
          stats.addErrors();
        } else {
          if (table) {
            output.HDF5.appendRecords(group.id, basename, records);
          } else {
            output.HDF5.makeTable(group.id, basename, records);
            table = true;
            emitter.emit('status', (0, _util.padString)('Parsing rows... ', 32));
          }
          stats.addEntries();
        }
        if (stats.entries % options.flushEvery === 0) {
          group.flush();
          outfile.flush();
          emitter.emit('status', (0, _util.padString)('Parsed ' + stats.entries + ' rows...', 32));
        }
      } else {
        if (Array.isArray(options.metaRange) && row >= options.metaRange[0] && row < options.metaRange[1]) {
          meta[data[0]] = data[1];
        } else if (typeof options.labelRow === 'number' && row === options.labelRow) {
          meta.labels = data;
        }
        if (options.dataStart === 0 || row === options.dataStart - 1) {
          basename = _path2.default.basename(infile, _path2.default.extname(infile));
          var outpath = _path2.default.join(outdir, basename + '.h5');
          process.stdout.write('Opening HDF5 file for output at:\n' + outpath + '\n\n');
          outfile = output.HDF5.createFile(outpath);
          group = output.HDF5.createGroup(outfile, basename);
          for (var key in meta) {
            if (typeof meta === 'string' || typeof meta === 'number') {
              group[key] = meta[key];
            }
          }
          group.flush();
        }
      }
      row++;
    },
        onEnd = function onEnd(err) {
      emitter.emit('end');
      process.stdout.write(('Parsed ' + stats.entries + ' rows, closing file...').yellow);
      group.close();
      outfile.close();
      process.stdout.write('Done.\n'.yellow);
      if (err) {
        return reject(err);
      }
      resolve(stats);
    };

    input.CSV.parseFile(infile, onData, onEnd);
  });
};

exports.default = csvToHDF5;