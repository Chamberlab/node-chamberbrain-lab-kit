require('colors')
const path = require('path'),
  Promise = require('bluebird'),
  Logger = require('../logger').default,
  LMDB = require('../output').LMDB,
  LineChart = require('../plot').LineChart

const lmdb = new LMDB(),
  infile = path.resolve(process.env.IN_FILE)

lmdb.openEnv(infile)

const ChartjsNode = require('chartjs-node');
// 600x600 canvas size
var chartNode = new ChartjsNode(600, 600);
return chartNode.drawChart(chartJsOptions)
  .then(() => {
    // chart is created

    // get image as png buffer
    return chartNode.getImageBuffer('image/png');
  })
  .then(buffer => {
    Array.isArray(buffer) // => true
    // as a stream
    return chartNode.getImageStream('image/png');
  })
  .then(streamResult => {
    // using the length property you can do things like
    // directly upload the image to s3 by using the
    // stream and length properties
    streamResult.stream // => Stream object
    streamResult.length // => Integer length of stream
    // write to a file
    return chartNode.writeImageToFile('image/png', './testimage.png');
  })
  .then(() => {
    // chart is now written to the file path
    // ./testimage.png
  });

Promise.map(lmdb.dbIds, function (id) {
  lmdb.openDb(id)
  const txn = lmdb.beginTxn(true)
  lmdb.initCursor(txn, id)

  let entry = lmdb.getCursorData(txn, id, false),
    time = [],
    mv = []
  while (entry) {
    time.push(entry.data[0])
    mv.push(entry.data[1])
    lmdb.advanceCursor(id, false)
    entry = lmdb.getCursorData(txn, id, false)
  }

  const plotter = new LineChart({})
  plotter.axes = { x: time, y: mv }
  return plotter.makePlot().then(chart => {
    console.log(chart)
    lmdb.close()
  })


}).then(() => {
  process.exit(0)
}).catch(err => {
  Logger.error(err.message)
  Logger.debug(err.stack, 'cl:reduce')
  process.exit(err.code)
})
