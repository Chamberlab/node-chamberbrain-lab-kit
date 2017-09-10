require('colors')
const path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  Logger = require('../logger').default,
  Ruleset = require('../ruleset').default,
  LMDB = require('../output').LMDB

const rules = new Ruleset(),
  lmdb = new LMDB(),
  infile = path.resolve(process.env.IN_FILE),
  filename = path.basename(infile, path.extname(infile))

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
  console.log('STATS')
  console.log('----------------------------------------')
  let stats = ''
  rules._set.forEach(entry => {
    stats += `${entry.id}\t${entry.commands[0].log.length}\n`
  })
  fs.writeFileSync(path.join(__dirname, '..', '..', 'logs', `${filename}-stats.txt`), stats)
  process.stdout.write(stats)
  process.exit(0)
}).catch(err => {
  Logger.error(err.message)
  Logger.debug(err.stack, 'cl:analyze')
  process.exit(err.code)
})
