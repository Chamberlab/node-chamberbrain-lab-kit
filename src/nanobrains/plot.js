require('colors')
const path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  Logger = require('../logger').default,
  LMDB = require('../output').LMDB,
  LineChart = require('../plot').LineChart

const lmdb = new LMDB(),
  infile = path.resolve(process.env.IN_FILE)

lmdb.openEnv(infile)

Promise.map(lmdb.dbIds, function (id) {
  lmdb.openDb(id)
  const txn = lmdb.beginTxn(true)
  lmdb.initCursor(txn, id)

  let entry = lmdb.getCursorData(txn, id, false),
    plots = [],
    valueRange = { min: Number.MAX_VALUE, max: Number.MIN_VALUE }
  while (entry) {
    for (let i in entry.data) {
      if (i > 0) {
        if (i - 1 >= plots.length) {
          plots.push([])
        }
        if (entry.data[i] < valueRange.min) valueRange.min = entry.data[i]
        if (entry.data[i] > valueRange.max) valueRange.max = entry.data[i]
        plots[i - 1].push({key: entry.data[0], value: entry.data[i]})
      }
    }
    lmdb.advanceCursor(id, false)
    entry = lmdb.getCursorData(txn, id, false)
  }

  lmdb.close()

  if (process.env.ROUND_RANGE) {
    valueRange = { min: Math.floor(valueRange.min), max: Math.ceil(valueRange.max) }
  }

  console.log('MIN value', valueRange.min)
  console.log('MAX value', valueRange.max)

  return Promise.map(plots, (plot, i) => {
    const plotter = new LineChart(valueRange)
    plotter.data = plot
    console.log('Plotting channel', i + 1)
    return plotter.makePlot(plot.length, 1080)
      .then(chart => {
        let pad = i < 9 ? '0' : ''
        fs.writeFileSync(path.join(__dirname, '..', '..', 'plots',
          `${path.basename(infile, path.extname(infile))}-ch-${pad}${i + 1}.svg`), chart)
      })
  }, {concurrency: 4})
}, {concurrency: 1}).then(() => {
  process.exit(0)
}).catch(err => {
  Logger.error(err.message)
  Logger.debug(err.stack, 'cl:reduce')
  process.exit(err.code)
})
