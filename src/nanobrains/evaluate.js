const path = require('path'),
  fs = require('fs'),
  Chord = require('../plot').Chord,
  LineChart = require('../plot').LineChart,
  SelectNoteCOF = require('../commands').SelectNoteCOF,
  MIDI = require('../output').MIDI,
  util = require('../util'),
  noteBands = require('../util/harmonic-matrix').noteBands,
  Harmonics = require('../util').Harmonics,
  roots = require('../util/harmonic-matrix').roots,
  Promise = require('bluebird')

const basepath = process.env.BASE_PATH,
  filenames = fs.readdirSync(basepath),
  entries = {}

filenames.forEach(filename => {
  if (path.extname(filename) === '.json') {
    const log = JSON.parse(fs.readFileSync(path.join(basepath, filename)))
    for (let id in log) {
      const idParts = id.split('_'),
        groupId = idParts.slice(0, 3).join('_'),
        ruleId = idParts.slice(3, 5).join('_'),
        sigId = idParts[5],
        paramId = idParts[6]
      let params
      if (ruleId.indexOf('sync') === 0) params = parseFloat(paramId)
      else if (ruleId.indexOf('band') === 0) {
        const values = paramId.split('x').map(v => parseFloat(v)).sort(util.sort.primitveNumbersAsc)
        params = {low: values[0], high: values[1]}
      }
      if (!entries[groupId]) entries[groupId] = {}
      if (!entries[groupId][ruleId]) entries[groupId][ruleId] = {}
      if (!entries[groupId][ruleId][sigId]) entries[groupId][ruleId][sigId] = {}
      if (!entries[groupId][ruleId][sigId][paramId]) entries[groupId][ruleId][sigId][paramId] = {p: params, v: []}
      log[id].entries.forEach(v => {
        entries[groupId][ruleId][sigId][paramId].v.push(v)
      })
    }
  }
})

const frames = {},
  notes = {},
  index = {
    root: 0,
    mode: 0,
    degree: 1,
    chord: 0,
    octave: 3
  },
  cof = new SelectNoteCOF(roots[index.root], index.octave)
let count = 0
for (let groupId in entries) {
  if (!notes[groupId]) notes[groupId] = {}
  for (let ruleId in entries[groupId]) {
    const isBand = ruleId.indexOf('band_') === 0,
      sigIds = isBand ? ['abs'] : ['pos', 'neg']
    for (let sigId of sigIds) {
      if (entries[groupId][ruleId][sigId]) {
        for (let paramId in entries[groupId][ruleId][sigId]) {
          const values = entries[groupId][ruleId][sigId][paramId].v
          let bandIndex = -1,
            process = false,
            msKey
          if (!Array.isArray(values)) throw new Error(`Broken entry for ${groupId}_${ruleId}_${sigId}_${paramId}`)
          if (isBand) {
            bandIndex = noteBands.indexOf(paramId)
            process = (bandIndex > -1)
          }
          else {
            process = sigId === 'pos'
          }
          if (isBand && process) {
            values.sort(util.sort.framesByStringTimeAsc)
            for (let entry of values) {
              msKey = entry[0]
              if (typeof msKey === 'string') {
                if (!Array.isArray(notes[groupId][msKey])) notes[groupId][msKey] = []
                /*
                if (!Array.isArray(frames[msKey])) {
                  frames[msKey] = new Array(64).fill(null).map((v, i) => {
                    return new Array(64).fill(0.0)
                  })
                }
                */
                /*
                let ink = parseInt(Object.keys(entry[1])[0]) - 1
                for (let row in frames[msKey]) {
                  if (ink === parseInt(row)) {
                    for (let n of Object.keys(entry[1]).slice(1)) {
                      const ni = parseInt(n) - 1
                      if (typeof n === 'string' && n[0] !== '_') {
                        const nv = entry[1][n]
                        frames[msKey][parseInt(row)][ni] = nv
                      }
                    }
                  }
                }
                */
                cof.position = bandIndex
                const range = cof.range,
                  note = range.length > 0 ? range[range.length - 1] : undefined
                if (bandIndex > -1 && note && notes[groupId][msKey].indexOf(note) === -1) notes[groupId][msKey].push(note)
                count++
                if (count % 100000 === 0) console.log(`${count} entries processed`)
              }
            }
          }
        }
      }
    }
  }
}

let frameNum = 0
function makeChordPlot (ms, frameNum, data, filename) {
  frameNum = frameNum.toString()
  while (frameNum.length < 6) frameNum = '0' + frameNum
  console.log(`Frame #${frameNum}\tTime ${ms.toFixed(3)}ms`)
  const plotter = new Chord()
  plotter.data = data
  return plotter.makePlot(1920, 1080)
    .then(svg => {
      frameNum = frameNum.toString()
      while (frameNum.length < 6) frameNum = '0' + frameNum
      return Promise.promisify(fs.writeFile)(`${filename}-chrd-${frameNum}.svg`, svg)
    })
    .then(() => {
      return parseInt(frameNum) + 1
    })
}
function makeScatterPlot (data, filename) {
  const plotter = new LineChart({min: 0, max: 128}, undefined, false, true)
  plotter.data = data
  return plotter.makePlot(1920, 600)
    .then(svg => {
      return Promise.promisify(fs.writeFile)(`${filename}.svg`, svg)
    })
}
function notesToGraph (notes, filename) {
  let groups = Object.keys(notes),
    basepath = path.join(__dirname, '..', '..', 'plots')
  return Promise.resolve()
    .then(() => {
      return Promise.promisify(fs.mkdir)(path.join(basepath, filename))
        .catch(() => { /* ignored */ })
    })
    .then(() => {
      return Promise.each(groups, group => {
        let data = []
        Object.keys(notes[group]).forEach(ms => {
          const midivals = Harmonics.getMidiFromNotes(notes[group][ms])
          midivals.forEach(val => {
            data.push({key: parseFloat(ms), value: val})
          })
        })
        return makeScatterPlot(data, path.join(path.join(basepath, filename, `${filename}-${group}`)))
      })
    })
}
function framesToGraph (frames, filename) {
  let times = Object.keys(frames), ms = 0,
    basepath = path.join(__dirname, '..', '..', 'anim')
  return Promise.resolve()
    .then(() => {
      return Promise.promisify(fs.mkdir)(path.join(basepath, filename))
        .catch(() => { /* ignored */ })
    })
    .then(() => {
      return Promise.each(times, msstr => {
        let frame = frames[msstr]
        ms = parseInt(msstr)
        return makeChordPlot(ms, frameNum, frame, path.join(basepath, filename, filename))
          .then(fn => {
            frameNum = fn
          })
      })
    })
}

Promise.resolve()
  .then(() => {
    // return framesToGraph(frames, `${path.basename(process.env.BASE_PATH)}-frames`)
  })
  .then(() => {
    // return notesToGraph(notes, `${path.basename(process.env.BASE_PATH)}-notes`)
  })
  .then(() => {
    return MIDI.notesToMidi(notes, 120, path.join(__dirname, '..', '..', 'midi', `${path.basename(process.env.BASE_PATH)}.mid`))
  })
  .then(() => {
    console.log(`${count} entries processed`)
    console.log('Done.')
  })
  .catch(err => {
    process.stderr.write(err.message)
    process.exit(err.code)
  })
