require('colors')
const path = require('path'),
  Debug = require('debug'),
  moment = require('moment'),
  microtime = require('microtime'),
  Big = require('big.js'),
  CLI = require('clui'),
  PB = require('../playback'),
  Stats = require('../stats').default,
  LMDB = require('../output').LMDB

const streams = {},
  stats = new Stats(),
  spinner = new CLI.Spinner(),
  lmdb = new LMDB(),
  osc = new PB.OSC(
    process.env.ADDR_LOCAL,
    process.env.ADDR_REMOTE,
    process.env.ADDR_REMOTE.indexOf('.255:') !== -1
  )

lmdb.openEnv(path.resolve(process.env.IN_FILE))
osc.on('ready', function () {
  Debug('cl:osc')('Ready')

  for (let id of lmdb.dbIds) {
    Debug('cl:scheduler')('Init')
    let bundle, keyMillis, slow, busy, workTime
    const address = process.env.OSC_ADDRESS || `/${id.split('-')[0]}`,
      proc = {
        scheduler: new PB.Scheduler(),
        frames: new PB.Frames()
      }
    proc.frames.fps = process.env.FPS
    streams[id] = proc

    process.stdout.write(`Opening DB ${id}...\n`.cyan)
    process.stdout.write(`Sending packets to osc://${process.env.ADDR_REMOTE}${address} ` +
      `at ${Big(process.env.FPS).toFixed(2)}fps\n\n`.yellow)
    lmdb.openDb(id)
    const txn = lmdb.beginTxn(true)
    lmdb.initCursor(txn, id)

    proc.scheduler.interval(`${proc.frames.interval.micros}u`, function () {
      if (process.env.DEBUG) {
        Debug('cl:scheduler')(`Diff: ${stats.micros}μs`)
        stats.micros = microtime.now()
      }
      workTime = streams[id].scheduler.duration(function () {
        if (busy) throw new Error('Scheduler calls overlap')
        busy = true

        if (bundle) {
          osc.sendBundle(bundle)
          let msg = `Sending... ${moment(Math.round(keyMillis)).format('HH:mm:ss:SSS')} (Ctrl-C to exit)`
          if (process.env.DEBUG && slow) {
            if (slow) msg += ` SLOW FRAME: ${workTime - proc.frames.interval.micros}μs over limit`.red
            Debug('cl:osc')(msg)
          }
          else if (spinner) spinner.message(msg)
        }

        let keyDiff, entry = lmdb.getCursorData(txn, id, true)
        keyMillis = entry.key
        keyDiff = entry.key.minus(keyMillis)
        proc.frames.data = entry.data
        while (keyDiff.lt(proc.frames.interval.millis) && keyDiff.gte(Big(0))) {
          proc.frames.interpolate(entry.data, PB.Frames.INTERPOLATE.MAX)
          lmdb.advanceCursor(id)
          entry = lmdb.getCursorData(txn, id, true)
          keyDiff = entry.key.minus(keyMillis)
        }

        bundle = PB.OSC.buildMessage(address, streams[id].frames.data)
        busy = false
      })

      if (process.env.DEBUG) {
        Debug('cl:scheduler')(`Work: ${workTime}μs`)
        slow = Big(workTime).gt(proc.frames.interval.micros)
      }
    })
  }

  if (!process.env.DEBUG) spinner.start()
})
