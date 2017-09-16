require('colors')
const path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  ChannelMatrix = require('../util').ChannelMatrix,
  Logger = require('../util').Logger,
  LogSyncFrames = require('../rulesets').LogSyncFrames,
  LMDB = require('../output').LMDB

const matrixId = process.env.MATRIX_ID || 'v1',
  config = {
    iterations: process.env.ITERATIONS ? parseInt(process.env.ITERATIONS) : 10,
    start: process.env.BAND_START ? parseFloat(process.env.BAND_START) : 0.1,
    step: process.env.BAND_STEP ? parseFloat(process.env.BAND_STEP) : 0.1
  },
  rules = new LogSyncFrames(config, ChannelMatrix[matrixId]),
  lmdb = new LMDB(),
  infile = path.resolve(process.env.IN_FILE),
  filename = path.basename(infile, path.extname(infile))

lmdb.openEnv(infile)

Promise.map(lmdb.dbIds, function (id) {
  console.log('Analyzing DB:', id)
  lmdb.openDb(id)
  const txn = lmdb.beginTxn(true)
  lmdb.initCursor(txn, id)

  let entry = lmdb.getCursorData(txn, id, false)
  while (entry) {
    rules.evaluate(entry.data.slice(1), entry.data[0])
    lmdb.advanceCursor(id, false)
    entry = lmdb.getCursorData(txn, id, false)
  }

  lmdb.close()
}, {concurrency: 1}).then(() => {
  const basename = `${filename}-${config.iterations}-${config.start.toFixed(3)}-${config.step.toFixed(3)}-${matrixId}`,
    basepath = path.join(__dirname, '..', '..', 'logs', basename)
  if (!fs.existsSync(basepath)) {
    fs.mkdirSync(basepath)
  }
  console.log('STATS')
  console.log('----------------------------------------')
  let stats = ''
  rules.entries.forEach(entry => {
    if (entry.commands[0].log.length) {
      const counts = entry.commands[0].counts.sort((a, b) => {
        a = parseInt(a)
        b = parseInt(b)
        if (a > b) return 1
        if (a < b) return -1
        return 0
      }).join(' ')
      const logLength = entry.commands[0].log.length
      let statsEntry = `${entry.id}\t${logLength}\t`
      statsEntry += `${logLength ? entry.commands[0].log[0].args[0] : ''}\t`
      statsEntry += `${logLength ? entry.commands[0].log[Math.max(0, logLength - 2)].args[0] : ''}\t`
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
