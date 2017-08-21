#!/usr/bin/env node --harmony
'use strict';

var setGeneral = function setGeneral(argv) {
  process.env.IN_FILE = argv.infile;
  process.env.OUT_DIR = argv.outdir;
  process.env.DATA_TYPE = argv.type;
  if (argv.debug) {
    process.env.DEBUG_MODE = true;
  }
};

var yargs = require('yargs') // eslint-disable-line
.command(['csv2lmdb', '*'], 'Convert NanoBrains CSV to LMDB', function () {}, function (argv) {
  setGeneral(argv);
  process.env.OUT_TYPE = 'lmdb';
  require('../nanobrains/convert');
}).command('csv2hdf5', 'Convert NanoBrains CSV to HDF5', function () {}, function (argv) {
  setGeneral(argv);
  process.env.OUT_TYPE = 'hdf5';
  require('../nanobrains/convert');
}).option('infile', {
  alias: 'i',
  describe: 'CSV input file',
  required: true
}).option('outdir', {
  alias: 'o',
  describe: 'LMDB output directory',
  required: true
}).option('type', {
  alias: 't',
  describe: 'Value type to be stored',
  default: 'Float64',
  choices: ['Float64', 'Float32']
}).option('debug', {
  alias: 'd',
  default: false
}).help().argv;