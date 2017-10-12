const MIDI = require('../input').MIDI,
  LMDB = require('../output').LMDB,
  LineChart = require('../plot').LineChart,
  chordMap = require('../util/harmonic-matrix').chordMap,
  modes = require('../util/harmonic-matrix').modes,
  moment = require('moment'),
  path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  tonal = require('tonal'),
  plotter = new LineChart({min: 0, max: 128}, undefined, false, true),
  infile = process.env.IN_FILE,
  useScaleBuffer = (process.env.SCALE_BUFFER),
  scaleBufferSize = parseInt(process.env.SCALE_BUFFER_SIZE)

const lmdb = new LMDB(),
  dbfile = path.basename(infile, path.extname(infile)) + '-harmonic_log'
lmdb.openEnv(path.join(__dirname, '..', '..', 'midi', dbfile), 4, 1)
const uuid = lmdb.createDb({ infile })
const txn = lmdb.beginTxn()

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
  const log = [`HARMONIC LOG\n\nMIDI file ${infile}\nCreated ${moment()}\n\n`]
  flattened.forEach((track, t) => {
    const counts = [],
      scaleRank = {}
    let scaleBuffer = useScaleBuffer ? [] : null,
      currentScale = null,
      currentDegree = null
    Object.keys(track).sort().forEach(key => {
      const count = track[key].length
      if (counts.indexOf(count) === -1) counts.push(count)
      if (count) {
        const cont = track[key].map(nt => {
          return `${nt.value.toString()}x${nt.duration.toString()}`
        }).join(',')
        const nte = `cmd:NOTE|arr:${cont}`
        lmdb.put(txn, uuid, key, Buffer.from(nte, 'utf8'))
        process.stdout.write(`T${key}ms\t${nte}\n`)
      }
      if (count > 1) {
        const notes = track[key].map(te => { return te.value.toString() })
        if (scaleBuffer) {
          notes.forEach(nte => {
            if (scaleBuffer.length < scaleBufferSize) scaleBuffer.push(nte)
          })
        }
        const scale = tonal.scale.detect(scaleBuffer || notes)
        if (scale && scale.length) {
          const ls = scale.filter(k => {
            const tokens = tonal.scale.parse(k)
            for (let m of modes) {
              if (tokens.type && tokens.type.indexOf(m) !== -1) {
                return true
              }
            }
          })
          ls.forEach(sc => {
            const scale = tonal.scale.parse(sc)
            typeof scaleRank[scale.type] === 'number' ? scaleRank[scale.type]++ : scaleRank[scale.type] = 1
            if (sc !== currentScale) {
              currentScale = sc
              let ind = -1
              modes.forEach(m => {
                let id = scale.type.indexOf(m)
                if (id > -1) ind = id
              })
              const degr = `cmd:MODE|mde:${sc}x${ind}`
              lmdb.put(txn, uuid, key, Buffer.from(degr, 'utf8'))
              log.push(`T${key}ms\t${degr}\n`)
            }
          })
          if (scaleBuffer) scaleBuffer = []
        }
        else if (scaleBuffer) {
          scaleBuffer = scaleBuffer.concat(notes)
        }

        const chord = tonal.chord.detect(notes)
        if (chord && chord.length) {
          let found = false,
            tokens = null
          chord.forEach(fchrd => {
            fchrd = tonal.chord.parse(fchrd)
            let n = 0
            for (let deg in chordMap) {
              for (let chrd of chordMap[deg]) {
                if (!found) {
                  tokens = tonal.chord.parse(chordMap[deg][chrd])
                  if (tokens.type === fchrd.type) {
                    found = fchrd
                    if (currentDegree !== deg) {
                      currentDegree = deg
                      const degr = `cmd:DEGR|deg:${currentDegree}x${n}`
                      lmdb.put(txn, uuid, key, Buffer.from(degr, 'utf8'))
                      log.push(`T${key}\tms${degr}\n`)
                    }
                  }
                }
              }
              n++
            }
          })
          if (found) {
            const chrd = `cmd:CHRD|tonic:${found.tonic || ''}|type:${found.type || ''}`
            lmdb.put(txn, uuid, key, Buffer.from(chrd, 'utf8'))
            log.push(`T${key}ms\t${chrd}\n`)
          }
        }
      }
    })
    const rank = Object.keys(scaleRank)
      .map(k => { return {k: tonal.scale.parse(k).type, v: scaleRank[k]} })
      .sort((a, b) => { return b.v - a.v })
    const cstr = counts.map(c => { return c.toString() }).sort().join(' ')
    log.push(`\nMIDI tracks\t${t || 'n.a.'}\nLog entries\t${Object.keys(track).length}\nNote array sizes ${cstr}\n\n`)
    for (let r in rank) {
      log.push(`${r + 1}.\t${rank[r].v}\tinst. of ${rank[r].k}\n`)
    }
  })
  const logText = log.join('') + '\n\n'
  process.stdout.write(logText)

  lmdb.endTxn(txn)
  lmdb.close()

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
