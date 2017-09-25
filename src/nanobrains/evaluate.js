const path = require('path'),
  fs = require('fs'),
  tonal = require('tonal')

const basepath = process.env.BASE_PATH,
  filenames = fs.readdirSync(basepath),
  entries = {},
  stats = {}

const index = {
  root: 0,
  mode: 0,
  degree: 1,
  chord: 3,
  octave: 3
}

// const chords = tonal.chord.names()
// const scales = tonal.scale.names()
const noteBands = ['0.010x0.015', '0.015x0.020', '0.020x0.025', '0.025x0.030', '0.030x0.035', '0.035x0.040', '0.040x0.045']
const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const degrees = ['IV', 'I', 'V', 'II', 'VI', 'III', 'VII']
const modes = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian']
const chordMap = {
  IV: ['5', 'M', 'sus2', 'M6', 'Maj7', 'M7b5', 'Madd9', 'M69', 'M79', 'M7#11', 'M79#11', '13#11'],
  I: ['5', 'M', 'sus2', 'sus4', 'M6', 'Maj7', 'Madd9', 'M69', 'Maj79', 'M913'],
  V: ['5', 'M', 'sus2', 'sus4', 'M6', '7', '7sus4', 'Madd9', 'M69', 'Maj79', '9', 'm79', '119sus4', '13'],
  II: ['5', 'sus2', 'sus4', 'm', 'm6', '7sus4', 'm7', 'madd9', 'm69', 'm79', '119sus4', '7add4'],
  VI: ['5', 'sus2', 'sus4', 'm', '7sus4', 'm7', 'madd9', '119sus4', 'm11', 'm911', 'm7911'],
  III: ['5', 'sus4', 'm', '7sus4', 'm7', 'm7b9', '7add4'],
  VII: ['b5', 'mb5', 'm7b5']
}

function getFifths (root = 'C', steps = 6, offset = 0, clockwise = true) {
  return tonal.range.fifths(root, [offset || 0, (steps || 1) * (clockwise ? 1 : -1)])
}
function getNotes () {
  return tonal.scale.notes(`${getFifths(roots[index.root], 6)[index.degree]} ${modes[index.mode]}`)
}
function getIntervals () {
  return tonal.scale.intervals(`${roots[index.root]} ${modes[index.mode]}`)
}
function getChord (octaveShift = 0) {
  return tonal.chord.get(chordMap[degrees[index.degree]][index.chord],
    `${getFifths(roots[index.root], 6)[index.degree]}${index.octave + octaveShift}`)
}
function getMidi (notes) {
  if (!Array.isArray(notes)) notes = [notes]
  return notes.map(note => tonal.note.midi(note))
}

const syncMap = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]
function evalSync (syncSpikes) {
  syncSpikes = Math.max(0, Math.min(syncSpikes, syncMap.length - 1))
  return syncMap[syncSpikes]
}

const intervals = getIntervals(),
  chord = getChord(),
  cof = getFifths(roots[index.root]),
  midi = getMidi(chord)

function getFrameStats (frame) {
  const result = {
    ms: Number.MAX_VALUE,
    lo: { c: null, v: Number.MAX_VALUE },
    hi: { c: null, v: Number.MIN_VALUE },
    s: frame.length
  }
  frame.forEach(entry => {
    const channelIds = Object.keys(entry[1]).filter(key => {
      return key[0] !== '_'
    }).map(key => parseInt(key))
    if (entry[0] < result.ms) result.ms = entry[0]
    channelIds.forEach(channelId => {
      const id = `${channelId}`
      if (channelId[0] === '_') return
      if (entry[1][id] < result.lo.v) {
        result.lo.c = channelId
        result.lo.v = entry[1][id]
      }
      if (entry[1][id] > result.hi.v) {
        result.hi.c = channelId
        result.hi.v = entry[1][id]
      }
    })
  })
  return result.start === Number.MAX_VALUE ? null : result
}

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
      if (ruleId.indexOf('sync') === 0) {
        params = parseFloat(paramId)
      }
      else if (ruleId.indexOf('band') === 0) {
        const values = paramId.split('x').map(v => parseFloat(v))
        params = {low: values[0], high: values[1]}
      }
      if (!entries[groupId]) entries[groupId] = {}
      if (!entries[groupId][ruleId]) entries[groupId][ruleId] = {}
      if (!entries[groupId][ruleId][sigId]) entries[groupId][ruleId][sigId] = {}
      if (!entries[groupId][ruleId][sigId][paramId]) entries[groupId][ruleId][sigId][paramId] = {p: params, v: []}
      entries[groupId][ruleId][sigId][paramId].v = entries[groupId][ruleId][sigId][paramId].v.concat(log[id].entries)
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
      if (!entries[groupId][ruleId][sigId]) continue
      for (let paramId in entries[groupId][ruleId][sigId]) {
        const values = entries[groupId][ruleId][sigId][paramId].v
        let noteIndex = -1, process = false
        if (!Array.isArray(values)) throw new Error(`Broken entry for ${groupId}_${ruleId}_${sigId}_${paramId}`)
        if (isBand) {
          noteIndex = noteBands.indexOf(paramId)
          process = (noteIndex > -1)
        }
        else {
          process = false
        }
        if (!process) continue
        values.sort((a, b) => {
          return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0
        })
        let lastMs = null
        for (let entry of values) {
          const ms = Array.isArray(entry) && entry.length ? entry[0] : undefined
          if (ms) {
            const msQuant = ms - (ms % 125.0),
              msKey = msQuant.toFixed(3)
            if (msKey !== lastMs) {
              if (lastMs) {
                const frameStats = getFrameStats(frames[lastMs])
                if (frameStats) stats[lastMs] = frameStats
              }
              count++
              if (count % 100000 === 0) console.log(`${count} entries processed`)
              frames[msKey] = []
              notes[msKey] = []
              lastMs = msKey
            }
            frames[msKey].push(entry)
            const note = getNotes()[noteIndex]
            if (noteIndex > -1 && notes[msKey].indexOf(note) === -1) notes[msKey].push(note)
          }
        }
      }
    }
  }
}

console.log(`${count} entries processed`)
console.log('Done.')
