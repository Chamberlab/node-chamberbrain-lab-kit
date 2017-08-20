require('colors')
const path = require('path'),
  moment = require('moment'),
  Big = require('big.js'),
  microtime = require('microtime'),
  CLI = require('clui'),
  Playback = require('../playback'),
  LMDB = require('../output').LMDB

const infile = path.resolve(process.env.IN_FILE),
  local = process.env.ADDR_LOCAL || '0.0.0.0:8888',
  remote = process.env.ADDR_REMOTE || '127.0.0.1:9999',
  broadcast = remote.indexOf('.255:') !== -1,
  fps = process.env.FPS ? Big(process.env.FPS) : Big('50.0'),
  detectSlow = process.env.DEBUG_MODE ? parseInt(process.env.DEBUG_MODE) : 0,
  oscDefaultAddress = process.env.OSC_ADDRESS && process.env.OSC_ADDRESS[0] === '/' ? process.env.OSC_ADDRESS : null,
  osc = new Playback.OSC(local, remote, broadcast),
  spinner = new CLI.Spinner('Sending...'),
  lmdb = new LMDB(),
  schedulers = []

lmdb.openEnv(infile)

osc.on('ready', function () {
  for (let id of lmdb.dbIds) {
    process.stdout.write(`Opening DB ${id}...\n`.cyan)
    lmdb.openDb(id)
    const address = oscDefaultAddress || `/${id.split('-')[0]}`,
      txn = lmdb.beginTxn(true),
      interval = Big('1000').div(fps).round(0),
      scheduler = new Playback.Scheduler()
    let max, bundle,
      isBuildingFrame = false,
      millis = Big('0.0'),
      slow = false,
      frameTime = Big('0.0'),
      lastFrame = Big(microtime.nowDouble().toString()).times(Big('1000'))

    lmdb.initCursor(txn, id)
    process.stdout.write(`Sending packets to osc://${remote}${address} at ${fps.toFixed(2)}fps\n\n`.yellow)

    const intervalStr = `${interval}ms`
    scheduler.interval(intervalStr, function () {
      if (isBuildingFrame) return
      isBuildingFrame = true
      if (bundle) osc.sendBundle(bundle)
      let entry = lmdb.getCursorData(txn, id, true)
      max = entry.data
      millis = entry.key
      while (entry.key.minus(millis).lt(interval) && entry.key.minus(millis).gte(Big('0.0'))) {
        entry.data.forEach((val, i) => {
          if (max && val > max[i]) max[i] = val
        })
        lmdb.advanceCursor(id)
        entry = lmdb.getCursorData(txn, id, true)
      }
      bundle = Playback.OSC.buildMessage(address, max)
      isBuildingFrame = false
      if (detectSlow) {
        const nowMillis = Big(microtime.nowDouble().toString()).times(Big('1000'))
        frameTime = lastFrame.sub(nowMillis)
        lastFrame = nowMillis
        slow = frameTime.gt(interval)
      }
      let msg = `Sending... ${moment(Math.round(millis)).format('HH:mm:ss:SSS')}`
      if (detectSlow && slow) {
        msg += ` SLOW FRAME: ${frameTime.toFixed(3)}ms`
      }
      spinner.message(msg)
    })
    schedulers.push(scheduler)
  }
  if (!process.env.DEBUG_MODE) {
    spinner.start()
  }
})
