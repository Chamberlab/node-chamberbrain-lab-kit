require('colors')
const path = require('path'),
  fs = require('mz/fs'),
  Promise = require('bluebird'),
  Big = require('bignumber.js'),
  Logger = require('../util').Logger,
  LMDB = require('../output').LMDB,
  Diagram = require('../plot').Diagram,
  gm = require('gm')

const lmdb = new LMDB(),
  infile = path.resolve(process.env.IN_FILE),
  filename = path.basename(infile, path.extname(infile))

lmdb.openEnv(infile)

Promise.map(lmdb.dbIds, function (id) {
  return Promise.coroutine(function * () {
    lmdb.openDb(id)
    const diagram = new Diagram()
    const txn = lmdb.beginTxn(true)
    const pos = {
      mode: 0,
      deg: 0
    }
    let fnum = 1
    lmdb.initCursor(txn, id)

    function makePlot (ms, frameNum, data) {
      frameNum = frameNum.toString()
      while (frameNum.length < 6) frameNum = '0' + frameNum
      console.log(`Frame #${frameNum}\tTime ${ms.toFixed(3)}ms`)
      diagram.data = data
      const basename = path.join(__dirname, '..', '..', 'anim', `${filename}-diag-${frameNum}`)
      return diagram.makePlot(1000, 700)
        .then(svg => {
          return fs.writeFile(basename + '.svg', svg)
        })
        .then(() => {
          return new Promise((resolve, reject) => {
            gm(basename + '.svg')
              .negative()
              .write(basename + '.png', function (err) {
                if (err) return reject(err)
                resolve()
              })
          })
        })
        .then(() => fs.unlink(basename + '.svg'))
        .then(() => {
          return parseInt(frameNum) + 1
        })
    }

    const processRes = res => {
      let cmd = res.buffer.toString()
        .split('|')
        .map(pair => pair.split(':').filter((v, i) => { return i > 0 }))
        .map(param => param[0])
      cmd.unshift(res.key)
      return cmd
    }

    const fps = new Big(50),
      msint = new Big(1000).div(fps)
    let ms = new Big(0),
      data = {
        pos
      },
      lastKey = LMDB.stringKeyFromFloat(ms),
      res = lmdb.getCursorRaw(txn, id)
    while (res/* && fnum < 200*/) {
      let empty = 0
      if (LMDB.parseKey(res.key).sub(LMDB.parseKey(lastKey)).gt(msint)) {
        lastKey = res.key
        const tms = LMDB.parseKey(res.key)
        while (ms.lt(tms)) {
          fnum = yield makePlot(ms, fnum, data)
          empty++
          ms = ms.add(msint)
        }
        ms = new Big(tms)
      }
      let entry = processRes(res)
      if (entry[1] === 'MODE') {
        data.pos.mode = parseInt(entry[2].split('x')[1])
      }
      if (entry[1] === 'DEGR') {
        data.pos.deg = parseInt(entry[2].split('x')[1])
      }
      fnum = yield makePlot(ms, fnum, data)
      lmdb.advanceCursor(id, false)
      res = lmdb.getCursorRaw(txn, id)
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
