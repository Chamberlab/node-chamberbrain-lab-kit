require('colors')
const path = require('path'),
  Debug = require('debug'),
  moment = require('moment'),
  Big = require('big.js'),
  microtime = require('microtime'),
  CLI = require('clui'),
  Playback = require('../playback'),
  LMDB = require('../output').LMDB

const lmdb = new LMDB(),
  osc = new Playback.OSC(
    process.env.ADDR_LOCAL,
    process.env.ADDR_REMOTE,
    process.env.ADDR_REMOTE.indexOf('.255:') !== -1
  )

lmdb.openEnv(path.resolve(process.env.IN_FILE))
osc.on('ready', function () {
  Debug('cl:osc')('Ready')

  let spinner, schedulers
  for (let id of lmdb.dbIds) {
    process.stdout.write(`Opening DB ${id}...\n`.cyan)
    lmdb.openDb(id)

    Debug('cl:scheduler')('Init')
    const address = process.env.OSC_ADDRESS || `/${id.split('-')[0]}`
    let interpolated, bundle, millis, slow, busy, frameTime, lastFrameTime

    if (process.env.DEBUG) {
      lastFrameTime = microtime.now()
    }

    const txn = lmdb.beginTxn(true)
    lmdb.initCursor(txn, id)

    process.stdout.write(`Sending packets to osc://${process.env.ADDR_REMOTE}${address} ` +
      `at ${Big(process.env.FPS).toFixed(2)}fps\n\n`.yellow)

    const scheduler = new Playback.Scheduler(),
      intervalMicros = Big('1000000').div(Big(process.env.FPS)).round(0),
      intervalMillis = intervalMicros.div(Big('1000')).round(0)
    scheduler.interval(`${intervalMillis}m`, function () {
      if (process.env.DEBUG) {
        const nowMicros = microtime.now()
        Debug('cl:scheduler')(`Diff: ${nowMicros - lastFrameTime}μs`)
        lastFrameTime = nowMicros
      }
      let msg = '', entry
      if (busy) {
        throw new Error('Scheduler calls overlap!')
      }
      busy = true

      if (bundle) {
        osc.sendBundle(bundle)
        msg += `Sending... ${moment(Math.round(millis)).format('HH:mm:ss:SSS')} (Press Ctrl-C to abort)`
        if (process.env.DEBUG && slow) {
          if (slow) {
            msg += ` SLOW FRAME: ${frameTime}μs`
          }
          Debug('cl:osc')(msg)
        }
        else {
          if (spinner) spinner.message(msg)
        }
      }

      entry = lmdb.getCursorData(txn, id, true)
      interpolated = entry.data
      millis = entry.key

      while (entry.key.minus(millis).lt(intervalMillis) && entry.key.minus(millis).gte(Big('0.0'))) {
        entry.data.forEach((val, i) => {
          if (interpolated && val > interpolated[i]) interpolated[i] = val
        })
        lmdb.advanceCursor(id)
        entry = lmdb.getCursorData(txn, id, true)
      }

      bundle = Playback.OSC.buildMessage(address, interpolated)
      busy = false

      if (process.env.DEBUG) {
        const nowMicros = microtime.now()
        frameTime = nowMicros - lastFrameTime
        slow = Big(frameTime).gt(intervalMicros)
        Debug('cl:scheduler')(`Work: ${frameTime}μs`)
      }
    })
    if (!schedulers) {
      schedulers = [scheduler]
      continue
    }
    schedulers.push(scheduler)
  }
  if (!process.env.DEBUG) {
    if (!spinner) {
      spinner = new CLI.Spinner('Sending...')
    }
    spinner.start()
  }
})
