const path = require('path'),
  fs = require('fs'),
  Chord = require('../plot').Chord,
  SelectNoteCOF = require('../commands').SelectNoteCOF,
  MIDI = require('../output').MIDI,
  util = require('../util'),
  noteBands = require('../util/harmonic-matrix').noteBands,
  roots = require('../util/harmonic-matrix').roots,
  Promise = require('bluebird')

const basepath = process.env.BASE_PATH,
  quantPrecision = Math.max(parseInt(process.env.QUANTIZE_PRECISION || '-1'), -1),
  precision = Math.pow(10.0, quantPrecision || -1),
  quantizeMs = Math.max(parseFloat(process.env.QUANTIZE_MS || '125.0'), 125.0),
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
        const values = util.sort.primitveNumbersAsc(paramId.split('x').map(v => parseFloat(v)))
        params = {low: values[0], high: values[1]}
      }
      if (!entries[groupId]) entries[groupId] = {}
      if (!entries[groupId][ruleId]) entries[groupId][ruleId] = {}
      if (!entries[groupId][ruleId][sigId]) entries[groupId][ruleId][sigId] = {}
      if (!entries[groupId][ruleId][sigId][paramId]) entries[groupId][ruleId][sigId][paramId] = {p: params, v: []}
      log[id].entries.forEach(v => { entries[groupId][ruleId][sigId][paramId].v.push(v) })
    }
  }
})

const frames = {},
  notes = {}
let count = 0
for (let groupId in entries) {
  for (let ruleId in entries[groupId]) {
    const isBand = ruleId.indexOf('band_') === 0,
      sigIds = isBand ? ['abs'] : ['pos', 'neg']
    for (let sigId of sigIds) {
      if (entries[groupId][ruleId][sigId]) {
        // if (typeof frames[groupId] !== 'object') frames[groupId] = {}
        if (typeof notes[groupId] !== 'object') notes[groupId] = {}
        for (let paramId in entries[groupId][ruleId][sigId]) {
          const values = entries[groupId][ruleId][sigId][paramId].v
          const index = {
            root: 0,
            mode: 0,
            degree: 1,
            chord: 0,
            octave: 3
          }
          let bandIndex = -1,
            process = false
          if (!Array.isArray(values)) throw new Error(`Broken entry for ${groupId}_${ruleId}_${sigId}_${paramId}`)
          if (isBand) {
            bandIndex = noteBands.indexOf(paramId)
            process = false // (bandIndex > -1)
          }
          else {
            process = sigId === 'pos'
          }
          if (process) {
            values.sort(util.sort.framesByTimeAsc)
            let lastMs = null
            for (let entry of values) {
              const ms = Array.isArray(entry) && entry.length ? entry[0] : undefined
              if (typeof ms === 'number') {
                const msRound = precision ? Math.round(ms * precision) / precision : Math.round(ms),
                  msQuant = msRound - (msRound % quantizeMs),
                  msKey = quantPrecision > 0 ? msQuant.toFixed(quantPrecision) : Math.round(msQuant)
                if (msKey !== lastMs) {
                  if (lastMs) {
                    // const frameStats = getFrameStats(frames[groupId][lastMs])
                    // if (frameStats) stats[lastMs] = frameStats
                  }
                  count++
                  if (count % 100000 === 0) console.log(`${count} entries processed`)
                  if (!Array.isArray(frames[msKey])) {
                    frames[msKey] = new Array(64).fill(null).map((v, i) => {
                      return new Array(64).fill(0.0)
                    })
                  }
                  notes[groupId][msKey] = []
                  lastMs = msKey
                }
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
                const cof = new SelectNoteCOF(roots[index.root], index.octave),
                  note = cof.currentNote
                if (bandIndex > -1 && notes[groupId][msKey].indexOf(note) === -1) notes[groupId][msKey].push(note)
              }
            }
          }
        }
      }
    }
  }
}

let frameNum = 0
function makePlot (ms, frameNum, data, filename) {
  frameNum = frameNum.toString()
  while (frameNum.length < 6) frameNum = '0' + frameNum
  console.log(`Frame #${frameNum}\tTime ${ms.toFixed(3)}ms`)
  const plotter = new Chord()
  plotter.data = data
  return plotter.makePlot(1920, 1080)
    .then(svg => {
      frameNum = frameNum.toString()
      while (frameNum.length < 6) frameNum = '0' + frameNum
      fs.writeFileSync(path.join(__dirname, '..', '..', 'anim', `${filename}-chrd-${frameNum}.svg`), svg)
      return parseInt(frameNum) + 1
    })
}
function framesToGraph (frames, filename) {
  let times = Object.keys(frames), ms = 0
  return Promise.map(times, msstr => {
    let frame = frames[msstr]
    ms = parseInt(msstr)
    return makePlot(ms, frameNum, frame, filename)
      .then(fn => {
        frameNum = fn
      })
  }, {concurrency: 1})
}

framesToGraph(frames, path.basename(process.env.BASE_PATH))
  .then(() => {
    return MIDI.notesToMidi(notes, path.join(__dirname, '..', '..', 'midi', `${path.basename(process.env.BASE_PATH)}.mid`))
  })
  .then(() => {
    console.log(`${count} entries processed`)
    console.log('Done.')
  })
  .catch(err => {
    process.stderr.write(err.message)
    process.exit(err.code)
  })
