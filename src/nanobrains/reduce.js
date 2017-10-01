require('colors')
const path = require('path'),
  Big = require('big.js'),
  CLI = require('clui'),
  LMDB = require('../output').LMDB,
  HDF5 = require('../output').HDF5,
  Stats = require('../util').Stats

const infile = path.resolve(process.env.IN_FILE),
  outfile = path.resolve(process.env.OUT_FILE),
  basename = path.basename(outfile, path.extname(outfile)),
  fps = process.env.FPS ? Big(process.env.FPS) : Big('100.0'),
  debug = (process.env.DEBUG_MODE),
  spinner = new CLI.Spinner('Reducing...'),
  lmdb = new LMDB(),
  lmdbOut = new LMDB()

lmdb.openEnv(infile)
lmdbOut.openEnv(outfile)

for (let id of lmdb.dbIds) {
  process.stdout.write(`Opening DB ${id}...\n`.cyan)
  lmdb.openDb(id)
  const hdf = HDF5.createFile(path.join(path.dirname(outfile), `${basename}.h5`)),
    hdfgroup = HDF5.createGroup(hdf, id)
  hdfgroup.title = basename
  hdfgroup.flush()
  const outId = lmdbOut.createDb(Object.assign({}, lmdb.meta[id]))
  const txnRead = lmdb.beginTxn(true),
    txnWrite = lmdbOut.beginTxn(),
    interval = Big('1000.0').div(fps)
  let table = false, running = true, max, millis = 0
  lmdb.initCursor(txnRead, id)
  if (!debug) {
    spinner.start()
  }

  const stats = new Stats(),
    statsOut = new Stats()
  while (running) {
    let key, entry = lmdb.getCursorData(txnRead, id, true)
    stats.addEntries()
    if (millis === undefined) {
      max = entry.data.clone()
      millis = entry.key
      key = LMDB.stringKeyFromFloat(millis, lmdb.meta[id].key.length,
        lmdb.meta[id].key.precision, lmdb.meta[id].key.signed)
      lmdbOut.put(txnWrite, outId, key, max)
      const records = lmdb.meta[id].labels.map((label, idx) => {
        const column = Float64Array.from([max[idx]])
        column.name = label
        return column
      })
      if (table) {
        HDF5.appendRecords(hdfgroup.id, id, records)
      }
      else {
        HDF5.makeTable(hdfgroup.id, id, records)
        table = true
      }
      statsOut.addEntries()
    }
    max = entry.data
    millis = entry.key
    lmdb.advanceCursor(id)
    entry = lmdb.getCursorData(txnRead, id, true)
    while (entry.key.minus(millis).lt(interval) && entry.key.minus(millis).gte(Big('0.0'))) {
      entry.data.forEach((val, i) => {
        if (Array.isArray(max) && Math.abs(val) > Math.abs(max[i])) max[i] = val
      })
      lmdb.advanceCursor(id)
      entry = lmdb.getCursorData(txnRead, id, true)
      stats.addEntries()
    }
    if (entry.key.minus(millis).lt(Big('0.0'))) {
      running = false
    }
    else {
      key = LMDB.stringKeyFromFloat(millis, lmdb.meta[id].key.length,
        lmdb.meta[id].key.precision, lmdb.meta[id].key.signed)
      lmdbOut.put(txnWrite, outId, key, max)
      const records = lmdb.meta[id].labels.map((label, idx) => {
        const column = Float64Array.from([max[idx]])
        column.name = label
        return column
      })
      if (table) {
        HDF5.appendRecords(hdfgroup.id, id, records)
      }
      else {
        HDF5.makeTable(hdfgroup.id, id, records)
        table = true
      }
      statsOut.addEntries()
      lmdb.advanceCursor(id)
    }
  }

  spinner.stop()

  process.stdout.write('Closing...'.yellow)
  lmdbOut.endTxn(txnWrite)
  lmdbOut.close()
  hdfgroup.close()
  hdf.close()
  lmdb.endTxn(txnRead, false)
  lmdb.close()
  process.stdout.write('Done.\n'.yellow)

  process.stdout.write('\nINPUT'.cyan)
  stats.print()
  process.stdout.write('\nOUTPUT'.cyan)
  statsOut.print()
}
