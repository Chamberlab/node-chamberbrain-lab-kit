require('colors')
const path = require('path'),
  moment = require('moment'),
  Promise = require('bluebird'),
  Big = require('big.js'),
  CLI = require('clui'),
  PB = require('../playback'),
  Stats = require('../stats').default,
  Logger = require('../logger').default,
  LMDBTransferTool = require('../output').LMDBTransferTool

const processors = {},
  infile = path.resolve(process.env.IN_FILE),
  outfile = path.resolve(process.env.OUT_FILE),
  spinner = new CLI.Spinner(),
  ltt = new LMDBTransferTool(infile, outfile)

Promise.map(ltt.in.lmdb.dbIds, function (id) {
  return new Promise(function (resolve) {
    let keyMillis, isRunning = true
    const proc = {
      frames: new PB.Frames(),
      stats: new Stats(),
      outId: undefined
    }
    ltt.in.lmdb.openDb(id)
    proc.outId = ltt.out.lmdb.createDb(Object.assign({}, ltt.in.lmdb.meta[id]))
    proc.frames.fps = process.env.FPS
    processors[id] = proc

    ltt.in.lmdb.initCursor(ltt.in.txn, id)
    const worker = function (args) {
      const [lmdb, proc] = args
      proc.stats.workTime = proc.seq.duration(function () {
        if (spinner) spinner.message(`Sending... ${moment(Math.round(keyMillis)).format('HH:mm:ss:SSS')}`)

        let keyDiff, entry = lmdb.getCursorData(lmdb.in.txn, id, true)
        keyMillis = entry.key
        keyDiff = entry.key.minus(keyMillis)
        proc.frames.data = entry.data
        while (isRunning && keyDiff.lt(proc.frames.interval.millis) && keyDiff.gte(Big(0))) {
          if (!keyDiff.gte(0)) isRunning = false
          proc.frames.interpolate(entry.data, PB.Frames.INTERPOLATE.MAX)
          lmdb.in.lmdb.advanceCursor(id)
          entry = lmdb.in.lmdb.getCursorData(lmdb.in.txn, id, true)
          keyDiff = entry.key.minus(keyMillis)
        }

        lmdb.addRecord(proc.outId, keyMillis, proc.frames.data)
      })

      if (process.env.DEBUG) {
        Logger.debug(`Work: ${proc.stats.workTime}μs`, 'cl:reduce')
      }

      if (isRunning) {
        proc.seq.delay(0, worker, [lmdb, proc])
      }
      else {
        resolve()
      }
    }

    if (!process.env.DEBUG) spinner.start()
  })
}).then(() => {
  lmdb.close()
  process.exit(0)
}).catch(err => {
  Logger.error(err.message)
  Logger.debug(err.stack, 'cl:reduce')
  process.exit(err.code)
})
