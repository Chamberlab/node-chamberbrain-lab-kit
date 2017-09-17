const path = require('path'),
  fs = require('fs')

const basepath = process.env.BASE_PATH,
  filenames = fs.readdirSync(basepath)

const entries = {}
filenames.forEach(filename => {
  if (path.extname(filename) === '.json') {
    const log = JSON.parse(fs.readFileSync(path.join(basepath, filename)))
    for (let id in log) {
      if (!entries[id]) entries[id] = []
      entries[id] = entries[id].concat(log[id].entries)
    }
  }
})
let count = 0
for (let id in entries) {
  entries[id].sort((a, b) => {
    return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0
  })
  let lastMs, frame = []
  for (let entry of entries[id]) {
    const ms = Array.isArray(entry) && entry.length ? entry[0] : undefined
    if (ms) {
      if (lastMs && ms !== lastMs) {
        count++
        if (count % 100000 === 0) console.log(`${count} entries processed`)
        frame = []
      }
      frame.push(entry)
      lastMs = ms
    }
  }
}

console.log(`${count} entries processed`)
console.log('Done.')
