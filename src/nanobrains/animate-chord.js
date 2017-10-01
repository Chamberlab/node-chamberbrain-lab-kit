require('colors')
const path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  Logger = require('../util').Logger,
  LMDB = require('../output').LMDB,
  Chord = require('../plot').Chord,
  ChannelMatrix = require('../util').ChannelMatrix,
  LogSyncFrames = require('../rulesets').LogSyncFrames,
  matrixId = process.env.MATRIX_ID || 'v1',
  syncRules = new LogSyncFrames(ChannelMatrix[matrixId])

const lmdb = new LMDB(),
  infile = path.resolve(process.env.IN_FILE),
  filename = path.basename(infile, path.extname(infile))

lmdb.openEnv(infile)

Promise.map(lmdb.dbIds, function (id) {
  return Promise.coroutine(function * () {
    lmdb.openDb(id)
    const chord = new Chord()
    const txn = lmdb.beginTxn(true)
    let fnum = 1
    lmdb.initCursor(txn, id)

    function makePlot (ms, frameNum, data) {
      frameNum = frameNum.toString()
      while (frameNum.length < 6) frameNum = '0' + frameNum
      console.log(`Frame #${frameNum}\tTime ${ms.toFixed(3)}ms`)
      chord.data = data
      return chord.makePlot(1920, 1080)
        .then(svg => {
          fs.writeFileSync(path.join(__dirname, '..', '..', 'plots', `${filename}-chord-${frameNum}.svg`), svg)
          return parseInt(frameNum) + 1
        })
    }

    let entry = lmdb.getCursorData(txn, id, false)
    while (entry) {
      for (let group of syncRules.grouping) {
        const key = syncRules.matrix ? syncRules.matrix._ID : undefined
        let band

      }
      fnum = yield makePlot(entry.data[0], fnum, entry.data.slice(1))
      lmdb.advanceCursor(id, false)
      entry = lmdb.getCursorData(txn, id, false)
    }

    lmdb.close()
  })()
}, {concurrency: 1}).then(() => {
  process.exit(0)
}).catch(err => {
  Logger.error(err.message)
  Logger.debug(err.stack, 'cl:plot')
  process.exit(err.code)
})
