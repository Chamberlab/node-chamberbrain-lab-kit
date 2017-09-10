require('colors')
const path = require('path'),
  Promise = require('bluebird'),
  Logger = require('../logger').default,
  Ruleset = require('../ruleset').default,
  LMDB = require('../output').LMDB

const rules = new Ruleset(),
  lmdb = new LMDB(),
  infile = path.resolve(process.env.IN_FILE)

lmdb.openEnv(infile)

Promise.map(lmdb.dbIds, function (id) {
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
  process.exit(0)
}).catch(err => {
  Logger.error(err.message)
  Logger.debug(err.stack, 'cl:analyze')
  process.exit(err.code)
})
