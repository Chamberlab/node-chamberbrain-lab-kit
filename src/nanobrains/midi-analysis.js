const MIDI = require('../input').MIDI,
  LMDB = require('../output').LMDB,
  LineChart = require('../plot').LineChart,
  path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  tonal = require('tonal'),
  plotter = new LineChart({min: 0, max: 128}, undefined, false, true),
  infile = process.env.IN_FILE

MIDI.readFile(path.resolve(infile)).then(result => {
  const flattened = []
  return Promise.each(result.tracks, track => {
    const parallel = {}
    track.forEach(event => {
      const key = LMDB.stringKeyFromFloat(event.time.scalar)
      if (Array.isArray(parallel[key])) parallel[key].push(event)
      else parallel[key] = [event]
    })
    flattened.push(parallel)
  }).then(() => {
    return flattened
  })
}).then(flattened => {
  const log = [`File: ${infile}\n\n`]
  flattened.forEach((track, t) => {
    const counts = [],
      scaleRank = {}
    Object.keys(track).sort().forEach(key => {
      const count = track[key].length
      if (counts.indexOf(count) === -1) counts.push(count)
      if (count > 1) {
        const notes = track[key].map(te => { return te.value.toString() }),
          scale = tonal.scale.detect(notes),
          chord = tonal.chord.detect(notes)
        if (scale && scale.length) {
          scale.forEach(sc => { typeof scaleRank[sc] === 'number' ? scaleRank[sc]++ : scaleRank[sc] = 1 })
          log.push(`Time: ${key}ms Scale: ${scale.join(', ')}\n`)
        }
        if (chord && chord.length) {
          log.push(`Time: ${key}ms Chord: ${chord.join(', ')}\n`)
        }
      }
    })
    const cstr = counts.map(c => { return c.toString() }).sort().join(' ')
    log.push(`\nTrack ${t} - Entries: ${Object.keys(track).length} - Counts: ${cstr}\n\n`)
    for (let scale in scaleRank) log.push(`Scale: ${scale} detected ${scaleRank[scale]}x\n`)
  })
  const logText = log.join('') + '\n\n'
  process.stdout.write(logText)
  const outfile = path.join(__dirname, '..', '..', 'logs',
    `${path.basename(infile, path.extname(infile))}-midi-resurrected.txt`)
  return Promise.promisify(fs.writeFile)(outfile, logText)
    .then(() => { return flattened })
}).then(flattened => {
  const data = []
  flattened.forEach((track) => {
    Object.keys(track).sort().forEach(key => {
      track[key].forEach(te => { data.push({ key: te.time.scalar, value: te.value.toMidi() }) })
    })
  })
  plotter.data = data
  return plotter.makePlot(6000, 800, 100, infile)
    .then(svg => {
      const outfile = path.join(__dirname, '..', '..', 'plots',
        `${path.basename(infile, path.extname(infile))}-midi-resurrected.svg`)
      return Promise.promisify(fs.writeFile)(outfile, svg)
    })
})
