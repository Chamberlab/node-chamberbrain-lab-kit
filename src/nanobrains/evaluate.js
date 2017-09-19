const path = require('path'),
  fs = require('fs')

const basepath = process.env.BASE_PATH,
  filenames = fs.readdirSync(basepath),
  entries = {},
  stats = {}

const modeMap = {
  lydian: {

  },
  ionian: {

  },
  mixoldydian: {

  },
  dorian: {

  },
  aeolian: {

  },
  phrygian: {

  },
  locrian: {

  }
}

const chordMap = {
  IV: ['5', 'M', 'sus2', 'M6', 'Maj7', 'M7b5', 'Madd9', 'M69', 'M79', 'M7#11', 'M79#11', '13#11'],
  I: ['5', 'M', 'sus2', 'sus4', 'M6', 'Maj7', 'Madd9', 'M69', 'Maj79', 'M913'],
  V: ['5', 'M', 'sus2', 'sus4', 'M6', '7', '7sus4', 'Madd9', 'M69', 'Maj79', '9', 'm79', '119sus4', '13'],
  II: ['5', 'sus2', 'sus4', 'm', 'm6', '7sus4', 'm7', 'madd9', 'm69', 'm79', '119sus4', '7add4'],
  VI: ['5', 'sus2', 'sus4', 'm', '7sus4', 'm7', 'madd9', '119sus4', 'm11', 'm911', 'm7911'],
  III: ['5', 'sus4', 'm', '7sus4', 'm7', 'm7b9', '7add4'],
  VII: ['b5', 'mb5', 'm7b5']
}

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
      if (!entries[id]) entries[id] = []
      entries[id] = entries[id].concat(log[id].entries)
    }
  }
})

const frames = {}
let count = 0
for (let id in entries) {
  entries[id].sort((a, b) => {
    return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0
  })
  let lastMs = null
  for (let entry of entries[id]) {
    const ms = Array.isArray(entry) && entry.length ? entry[0] : undefined
    if (ms) {
      const msKey = ms.toFixed(3)
      if (msKey !== lastMs) {
        if (lastMs) {
          const frameStats = getFrameStats(frames[lastMs])
          if (frameStats) stats[lastMs] = frameStats
        }
        count++
        if (count % 100000 === 0) console.log(`${count} entries processed`)
        frames[msKey] = []
        lastMs = msKey
      }
      frames[msKey].push(entry)
    }
  }
}

console.log(`${count} entries processed`)
console.log('Done.')
