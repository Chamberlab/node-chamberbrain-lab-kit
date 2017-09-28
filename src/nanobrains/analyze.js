require('colors')
const path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  ChannelMatrix = require('../util').ChannelMatrix,
  Logger = require('../util').Logger,
  LogBandFrames = require('../rulesets').LogBandFrames,
  LogSyncFrames = require('../rulesets').LogSyncFrames,
  LMDB = require('../output').LMDB

const matrixId = process.env.MATRIX_ID || 'v1',
  bandRules = new LogBandFrames(ChannelMatrix[matrixId]),
  syncRules = new LogSyncFrames(ChannelMatrix[matrixId]),
  lmdb = new LMDB(),
  infile = path.resolve(process.env.IN_FILE),
  filename = path.basename(infile, path.extname(infile)),
  iterations = process.env.ITERATIONS ? parseInt(process.env.ITERATIONS) : 1,
  start = process.env.BAND_START ? parseFloat(process.env.BAND_START) : 0.1,
  step = process.env.BAND_STEP ? parseFloat(process.env.BAND_STEP) : 0.1,
  syncMin = process.env.SYNC_THRESHOLD ? parseFloat(process.env.SYNC_THRESHOLD) : 0.1,
  topMin = process.env.TOP_BAND_START ? parseFloat(process.env.TOP_BAND_START) : 0.1,
  topMax = process.env.TOP_BAND_END ? parseFloat(process.env.TOP_BAND_END) : 0.1

for (let group of syncRules.grouping) {
  const key = syncRules.matrix ? syncRules.matrix._ID : undefined
  let band

  for (let b = 0; b < iterations; b++) {
    band = {low: start + step * b, high: start + step * (b + 1)}
    bandRules.entries.push(LogBandFrames.makeBandRule(1, band, true, group, key))
    bandRules.entries.push(LogBandFrames.makeBandRule(1, band, false, group, key))
    bandRules.entries.push(LogBandFrames.makeBandRule(1, {low: band.high * -1.0, high: band.low * -1.0}, false, group, key))
  }

  band = {low: topMin, high: topMax}
  bandRules.entries.push(LogBandFrames.makeBandRule(1, band, true, group, key))
  bandRules.entries.push(LogBandFrames.makeBandRule(1, band, false, group, key))
  bandRules.entries.push(LogBandFrames.makeBandRule(1, {low: band.high * -1.0, high: band.low * -1.0}, false, group, key))

  syncRules.entries.push(LogSyncFrames.makeSyncRule(1, syncMin, true, group, key))
  syncRules.entries.push(LogSyncFrames.makeSyncRule(1, syncMin, false, group, key))
  syncRules.entries.push(LogSyncFrames.makeSyncRule(1, syncMin * -1.0, false, group, key))
}

lmdb.openEnv(infile)

Promise.map(lmdb.dbIds, function (id) {
  console.log('Analyzing DB:', id)
  lmdb.openDb(id)
  const txn = lmdb.beginTxn(true)
  lmdb.initCursor(txn, id)

  let entry = lmdb.getCursorData(txn, id, false)
  while (entry) {
    bandRules.evaluate(entry.data.slice(1), entry.data[0])
    syncRules.evaluate(entry.data.slice(1), entry.data[0])
    lmdb.advanceCursor(id, false)
    entry = lmdb.getCursorData(txn, id, false)
  }

  lmdb.close()
}, {concurrency: 1}).then(() => {
  const basename = `${filename}-${iterations}-${start.toFixed(3)}-${step.toFixed(3)}-${matrixId}`,
    basepath = path.join(__dirname, '..', '..', 'logs', basename)
  if (!fs.existsSync(basepath)) {
    fs.mkdirSync(basepath)
  }
  console.log('STATS')
  console.log('----------------------------------------')
  let stats = ''
  syncRules.entries.forEach(entry => {
    let entrySize = 0,
      first = Number.MAX_VALUE,
      last = Number.MIN_VALUE

    Object.keys(entry.commands[0].log).forEach(id => {
      const log = entry.commands[0].log[id],
        // FIXME: this hack for my b0rked lmdb import needs to go!
        logLen = Math.max(0, log.entries.length - 1)
      if (logLen) {
        entrySize += logLen
        // order entries chronologically by ms
        log.entries.sort((a, b) => {
          return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0
        })
        if (log.entries[0][0] < first) first = log.entries[0][0]
        if (log.entries[logLen - 1][0] > last) last = log.entries[logLen - 1][0]
      }
      // else delete entry.commands[0].log[id]
    })

    if (entrySize) {
      const counts = entry.commands[0].counts.sort((a, b) => {
        a = parseInt(a)
        b = parseInt(b)
        return a > b ? 1 : a < b ? -1 : 0
      }).join(' ')

      let statsEntry = `${entry.id}\t${entrySize}\t`
      statsEntry += `${entrySize ? first : ''}\t`
      statsEntry += `${entrySize ? last : ''}\t`
      statsEntry += `${counts}\n`
      stats += statsEntry
      process.stdout.write(statsEntry)
      fs.writeFileSync(path.join(basepath, `${entry.id}.json`), JSON.stringify(entry.commands[0].log))
    }
  })
  bandRules.entries.forEach(entry => {
    let entrySize = 0,
      first = Number.MAX_VALUE,
      last = Number.MIN_VALUE

    Object.keys(entry.commands[0].log).forEach(id => {
      const log = entry.commands[0].log[id],
        // FIXME: this hack for my b0rked lmdb import needs to go!
        logLen = Math.max(0, log.entries.length - 1)
      if (logLen) {
        entrySize += logLen
        // order entries chronologically by ms
        log.entries.sort((a, b) => {
          return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0
        })
        if (log.entries[0][0] < first) first = log.entries[0][0]
        if (log.entries[logLen - 1][0] > last) last = log.entries[logLen - 1][0]
      }
      // else entry.commands[0].log[id] = undefined
    })

    if (entrySize) {
      const counts = entry.commands[0].counts.sort((a, b) => {
        a = parseInt(a)
        b = parseInt(b)
        return a > b ? 1 : a < b ? -1 : 0
      }).join(' ')

      let statsEntry = `${entry.id}\t${entrySize}\t`
      statsEntry += `${entrySize ? first : ''}\t`
      statsEntry += `${entrySize ? last : ''}\t`
      statsEntry += `${counts}\n`
      stats += statsEntry
      process.stdout.write(statsEntry)
      fs.writeFileSync(path.join(basepath, `${entry.id}.json`), JSON.stringify(entry.commands[0].log))
    }
  })
  fs.writeFileSync(path.join(basepath, `${basename}-stats.csv`), stats)
  process.exit(0)
}).catch(err => {
  Logger.error(err.message)
  Logger.debug(err.stack, 'cl:analyze')
  process.exit(err.code)
})
