require('colors')
const path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  util = require('../util'),
  LogBandFrames = require('../rulesets').LogBandFrames,
  LogSyncFrames = require('../rulesets').LogSyncFrames,
  LMDB = require('../output').LMDB

process.stdout.write('\n\nStarting data analysis...\n'.cyan)

const matrixId = process.env.MATRIX_ID || 'v1',
  bandRules = new LogBandFrames(matrixId),
  syncRules = new LogSyncFrames(matrixId),
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

  let band = {low: topMin, high: topMax}
  bandRules.addEntry(LogBandFrames.makeBandRule(1, band, true, group, key))
  for (let b = start; b < start + iterations * step; b += step) {
    band = {low: b, high: b + step}
    bandRules.addEntry(LogBandFrames.makeBandRule(1, band, true, group, key))
  }

  syncRules.addEntry(LogSyncFrames.makeSyncRule(1, syncMin, false, group, key))
  syncRules.addEntry(LogSyncFrames.makeSyncRule(1, syncMin * -1.0, false, group, key))
}

lmdb.openEnv(infile)
for (let id of lmdb.dbIds) {
  process.stdout.write(`Reading and processing from LMDB ${id}...`.yellow)
  let txn, entry
  lmdb.openDb(id)
  txn = lmdb.beginTxn(true)
  lmdb.initCursor(txn, id)
  while ((entry = lmdb.getCursorData(txn, id, false))) {
    let sub = entry.data.subarray(1)
    bandRules.evaluate(sub, entry.key)
    syncRules.evaluate(sub, entry.key)
    lmdb.advanceCursor(id, false)
  }
  process.stdout.write(`done.\n`.yellow)
  lmdb.close()
}

console.log('\n\nSTATS')
console.log('----------------------------------------')
let stats = ''

function storeRuleEntries (entries, basepath) {
  return Promise.each(Object.keys(entries), entryId => {
    const entry = entries[entryId]
    let outLog = {}, entrySize = 0, timeRange

    for (let id in entry.commands[0].log) {
      const log = entry.commands[0].log[id]
      if (Array.isArray(log.entries)) {
        log.entries.sort(util.sort.framesByTimeAsc)
        // FIXME: this hack for my b0rked lmdb import needs to go!
        if (log.entries.length) log.entries.pop()
        if (log.entries.length) {
          entrySize += log.entries.length
          timeRange = util.Stats.updateValueRange(log.entries[0][0])
          timeRange = util.Stats.updateValueRange(log.entries[log.entries.length - 1][0], timeRange)
          outLog[id] = {entries: []}
          for (let e of log.entries) outLog[id].entries.push(e)
        }
      }
    }

    if (entrySize && entry.commands.length > 0) {
      let countstr = Object.keys(entry.commands[0].counts).map(c => { return parseInt(c) })
          .sort(util.sort.primitveNumbersAsc).join(' '),
        statsEntry = `${entry.id}\t${entrySize}\t` +
          `${entrySize ? timeRange.min : ''}\t${entrySize ? timeRange.max : ''}\t${countstr}\n`
      stats += statsEntry
      process.stdout.write(statsEntry)
      return Promise.promisify(fs.writeFile)(path.join(basepath, `${entry.id}.json`), JSON.stringify(outLog))
    }
  })
}

const basename = `${filename}-${iterations}-${start.toFixed(3)}-${step.toFixed(3)}-${syncMin.toFixed(3)}-${matrixId}`,
  basepath = path.join(__dirname, '..', '..', 'logs', basename)

Promise.resolve()
  .then(() => {
    process.stdout.write(`Storing results at ${basepath}...`.yellow)
    return Promise.promisify(fs.mkdir)(basepath).catch(err => { if (err.code !== 'EEXIST') throw err })
  })
  .then(() => { return storeRuleEntries(syncRules.entries, basepath) })
  .then(() => { return storeRuleEntries(bandRules.entries, basepath) })
  .then(() => {
    return new Promise((resolve, reject) => {
      fs.writeFileSync(path.join(basepath, `${basename}-stats.csv`), stats, (err) => {
        if (err) reject(err)
        else {
          process.stdout.write(`done.\n`.yellow)
          resolve()
        }
      })
    })
  })
  .then(() => {
    process.stderr.write('\nAnalysis complete, exiting.\n\n'.cyan)
    process.exit(0)
  })
  .catch(err => {
    process.stderr.write(`\nFatal error code ${err.code} during data analysis: ${err.message}\n`)
    process.stderr.write(`STACK:\n${err.stack}\n\n`)
    process.exit(err.code)
  })
